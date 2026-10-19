import { describe, expect, it } from "vitest";

import {
    DEFAULT_CONFIG,
    MAX_CUSTOM_MESSAGE_LENGTH_CHARACTERS,
    STANDARD_MESSAGES,
    WIZARD_MESSAGES,
} from "../../src/utils/constants.js";
import {
    compileMessageTemplate,
    mergeThemeMessages,
    resolveBaseTheme,
    validateThemeOverrides,
} from "../../src/utils/theme.js";

describe("resolveBaseTheme", () => {
    it.each([
        ["wizard", "wizard"],
        ["standard", "standard"],
    ] as const)("returns %s for the built-in %s theme", (theme, expectedBase) => {
        const config = { theme, customTheme: DEFAULT_CONFIG.customTheme };

        expect(resolveBaseTheme(config)).toBe(expectedBase);
    });

    it("returns the extended theme for a custom theme", () => {
        const config = {
            theme: "custom" as const,
            customTheme: { extends: "standard" as const, messages: {} },
        };

        expect(resolveBaseTheme(config)).toBe("standard");
    });
});

describe("validateThemeOverrides", () => {
    describe("when input is not an object", () => {
        it.each([null, undefined, "intro", 42, ["commit"]])(
            "returns empty overrides for %s",
            (rawOverrides) => {
                expect(validateThemeOverrides(rawOverrides, STANDARD_MESSAGES)).toEqual(
                    {}
                );
            }
        );
    });

    describe("when input matches the reference shape", () => {
        it("keeps nested string messages", () => {
            const rawOverrides = {
                commit: { intro: "Launch" },
                errors: { commit: { noStaged: "Nothing staged" } },
            };

            const overrides = validateThemeOverrides(rawOverrides, STANDARD_MESSAGES);

            expect(overrides).toEqual(rawOverrides);
        });

        it("keeps strings at template function paths", () => {
            const rawOverrides = {
                errors: { commit: { tooLong: "Max {maxCharacters}" } },
            };

            const overrides = validateThemeOverrides(rawOverrides, STANDARD_MESSAGES);

            expect(overrides).toEqual(rawOverrides);
        });
    });

    describe("when input contains invalid entries", () => {
        it("drops keys that are not in the reference", () => {
            const rawOverrides = { commit: { intro: "Launch", unknown: "x" }, extra: {} };

            const overrides = validateThemeOverrides(rawOverrides, STANDARD_MESSAGES);

            expect(overrides).toEqual({ commit: { intro: "Launch" } });
        });

        it("drops non-string message values", () => {
            const rawOverrides = { commit: { intro: 42, exit: null, dryRunExit: ["a"] } };

            const overrides = validateThemeOverrides(rawOverrides, STANDARD_MESSAGES);

            expect(overrides).toEqual({});
        });

        it("drops a string where the reference expects a group", () => {
            const overrides = validateThemeOverrides(
                { commit: "Launch" },
                STANDARD_MESSAGES
            );

            expect(overrides).toEqual({});
        });

        it("drops a group where the reference expects a message", () => {
            const overrides = validateThemeOverrides(
                { commit: { intro: { text: "Launch" } } },
                STANDARD_MESSAGES
            );

            expect(overrides).toEqual({});
        });
    });

    describe("when strings need sanitizing", () => {
        it("strips ANSI escape and other control characters", () => {
            const rawOverrides = { commit: { intro: "\u001b[2JLaunch\u0007\n\u007f!" } };

            const overrides = validateThemeOverrides(rawOverrides, STANDARD_MESSAGES);

            expect(overrides.commit?.intro).toBe("[2JLaunch!");
        });

        it("strips C1 controls and bidirectional overrides", () => {
            const rawOverrides = { commit: { intro: "\u009b2JLaunch‮!⁦" } };

            const overrides = validateThemeOverrides(rawOverrides, STANDARD_MESSAGES);

            expect(overrides.commit?.intro).toBe("2JLaunch!");
        });

        it("keeps emoji variation selectors and joiners", () => {
            const emojiMessage = "⚠️ \u{1f9d9}‍♂️ Launch";

            const overrides = validateThemeOverrides(
                { commit: { intro: emojiMessage } },
                STANDARD_MESSAGES
            );

            expect(overrides.commit?.intro).toBe(emojiMessage);
        });

        it("does not split an emoji at the length limit", () => {
            const message = `${"a".repeat(MAX_CUSTOM_MESSAGE_LENGTH_CHARACTERS - 1)}\u{1f680}\u{1f680}`;

            const overrides = validateThemeOverrides(
                { commit: { intro: message } },
                STANDARD_MESSAGES
            );

            expect(overrides.commit?.intro?.endsWith("a\u{1f680}")).toBe(true);
        });

        it("truncates messages longer than the maximum length", () => {
            const longMessage = "a".repeat(MAX_CUSTOM_MESSAGE_LENGTH_CHARACTERS + 50);

            const overrides = validateThemeOverrides(
                { commit: { intro: longMessage } },
                STANDARD_MESSAGES
            );

            expect(overrides.commit?.intro).toHaveLength(
                MAX_CUSTOM_MESSAGE_LENGTH_CHARACTERS
            );
        });
    });
});

describe("compileMessageTemplate", () => {
    it("replaces a placeholder with its argument", () => {
        const tooLong = compileMessageTemplate("Max {maxCharacters}", ["maxCharacters"]);

        expect(tooLong(72)).toBe("Max 72");
    });

    it("keeps parentheses around a present argument", () => {
        const overwrite = compileMessageTemplate("Overwrite ({fileName})", ["fileName"]);

        expect(overwrite("a.json")).toBe("Overwrite (a.json)");
    });

    it("replaces repeated placeholders", () => {
        const render = compileMessageTemplate("{field} - set {field}", ["field"]);

        expect(render("theme")).toBe("theme - set theme");
    });

    it("maps multiple placeholders by argument position", () => {
        const render = compileMessageTemplate("{second} then {first}", [
            "first",
            "second",
        ]);

        expect(render("a", "b")).toBe("b then a");
    });

    it("returns the template unchanged when it has no placeholders", () => {
        const render = compileMessageTemplate("Plain text", ["field"]);

        expect(render("ignored")).toBe("Plain text");
    });

    it("leaves unknown placeholders as typed", () => {
        const render = compileMessageTemplate("Max {maxChars}", ["maxCharacters"]);

        expect(render(72)).toBe("Max {maxChars}");
    });

    describe("when an argument is missing", () => {
        it("removes parentheses left empty", () => {
            const overwrite = compileMessageTemplate("Overwrite? ({fileName})", [
                "fileName",
            ]);

            expect(overwrite()).toBe("Overwrite?");
            expect(overwrite(".husky/")).toBe("Overwrite? (.husky/)");
        });

        it("keeps parentheses that do not wrap the placeholder", () => {
            const overwrite = compileMessageTemplate("Overwrite? (keep ()) {fileName}", [
                "fileName",
            ]);

            expect(overwrite()).toBe("Overwrite? (keep ()) ");
        });

        it("renders the placeholder as an empty string", () => {
            const overwrite = compileMessageTemplate("Overwrite {fileName}?", [
                "fileName",
            ]);

            expect(overwrite(undefined)).toBe("Overwrite ?");
        });
    });

    it("does not evaluate placeholder content as code", () => {
        const render = compileMessageTemplate("{field}", ["field"]);

        expect(render("${process.exit()}")).toBe("${process.exit()}");
    });
});

describe("mergeThemeMessages", () => {
    it("returns messages equal to the base when there are no overrides", () => {
        const merged = mergeThemeMessages(WIZARD_MESSAGES, {});

        expect(merged).toEqual(WIZARD_MESSAGES);
    });

    it("replaces only the overridden messages", () => {
        const merged = mergeThemeMessages(STANDARD_MESSAGES, {
            commit: { intro: "Launch" },
            prompts: { type: "Mission type:" },
        });

        expect(merged.commit.intro).toBe("Launch");
        expect(merged.prompts.type).toBe("Mission type:");
        expect(merged.commit.exit).toBe(STANDARD_MESSAGES.commit.exit);
        expect(merged.errors).toEqual(STANDARD_MESSAGES.errors);
    });

    it("keeps base template functions that are not overridden", () => {
        const merged = mergeThemeMessages(STANDARD_MESSAGES, {});

        expect(merged.errors.commit.tooLong).toBe(
            STANDARD_MESSAGES.errors.commit.tooLong
        );
    });

    it("compiles overridden templates into functions", () => {
        const merged = mergeThemeMessages(STANDARD_MESSAGES, {
            errors: { commit: { tooLong: "Max {maxCharacters}" } },
        });

        expect(merged.errors.commit.tooLong(50)).toBe("Max 50");
    });

    it("compiles the projectFieldAction template with its field parameter", () => {
        const merged = mergeThemeMessages(STANDARD_MESSAGES, {
            config: { projectFieldAction: "Edit {field}" },
        });

        expect(merged.config.projectFieldAction("theme")).toBe("Edit theme");
    });

    it("compiles the overwrite template with its fileName parameter", () => {
        const merged = mergeThemeMessages(STANDARD_MESSAGES, {
            init: { overwrite: "Replace {fileName}?" },
        });

        expect(merged.init.overwrite("a.json")).toBe("Replace a.json?");
    });

    it("does not mutate the base theme", () => {
        const originalIntro = STANDARD_MESSAGES.commit.intro;

        mergeThemeMessages(STANDARD_MESSAGES, { commit: { intro: "Launch" } });

        expect(STANDARD_MESSAGES.commit.intro).toBe(originalIntro);
    });
});
