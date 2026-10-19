import type {
    BaseThemeName,
    MerlinConfig,
    ThemeMessageOverrides,
    ThemeMessages,
} from "../types/index.js";
import {
    MAX_CUSTOM_MESSAGE_LENGTH_CHARACTERS,
    TEMPLATE_PARAMETER_NAMES,
} from "./constants.js";

/**
 * A compiled custom template message, called the same way as the built-in
 * template functions (e.g. `tooLong(72)`).
 */
export type MessageTemplate = (...templateArguments: unknown[]) => string;

type MessageTree = { [key: string]: unknown };

/**
 * Characters stripped from custom messages so a shared .merlinrc.json cannot
 * drive or spoof the terminal: C0 controls (including ESC, which starts ANSI
 * escape sequences), DEL, C1 controls (including the 8-bit CSI U+009B), and
 * bidirectional embedding/override/isolate controls.
 */
// eslint-disable-next-line no-control-regex
const UNSAFE_CHARACTER_REGEX = /[\u0000-\u001F\u007F-\u009F‪-‮⁦-⁩]/g;

/**
 * Matches a `{name}` placeholder, together with parentheses wrapping it directly
 * (and the whitespace before them), so a missing argument can drop them too.
 */
const PLACEHOLDER_REGEX = /(\s*\()?\{(\w+)\}(\))?/g;

function isMessageTree(value: unknown): value is MessageTree {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function joinPath(pathPrefix: string, key: string): string {
    return pathPrefix ? `${pathPrefix}.${key}` : key;
}

/**
 * Removes unsafe characters and truncates a custom message to the allowed length.
 * Truncation counts code points, so an emoji is never cut into a broken half.
 */
function sanitizeMessage(message: string): string {
    const safeCharacters = Array.from(message.replace(UNSAFE_CHARACTER_REGEX, ""));
    return safeCharacters.slice(0, MAX_CUSTOM_MESSAGE_LENGTH_CHARACTERS).join("");
}

/**
 * Resolves the built-in theme that supplies messages and decoration.
 * A custom theme resolves to the theme it extends.
 *
 * @param config - Config holding the theme selection
 * @returns "wizard" or "standard"
 */
export function resolveBaseTheme(
    config: Pick<Required<MerlinConfig>, "theme" | "customTheme">
): BaseThemeName {
    return config.theme === "custom" ? config.customTheme.extends : config.theme;
}

function validateOverrideNode(rawNode: unknown, referenceNode: MessageTree): MessageTree {
    const validated: MessageTree = {};
    if (!isMessageTree(rawNode)) {
        return validated;
    }

    for (const [key, referenceValue] of Object.entries(referenceNode)) {
        const rawValue = rawNode[key];
        const isMessageLeaf =
            typeof referenceValue === "string" || typeof referenceValue === "function";

        if (isMessageLeaf) {
            if (typeof rawValue === "string") {
                validated[key] = sanitizeMessage(rawValue);
            }
            continue;
        }

        const validatedChild = validateOverrideNode(
            rawValue,
            referenceValue as MessageTree
        );
        if (Object.keys(validatedChild).length > 0) {
            validated[key] = validatedChild;
        }
    }
    return validated;
}

/**
 * Validates custom theme messages against the shape of a built-in theme.
 *
 * Keeps only string values at paths that exist in the reference (including
 * template paths, which accept `{placeholder}` strings). Unknown keys and
 * non-string values are dropped. Kept strings are sanitized.
 *
 * @param rawOverrides - Untrusted `customTheme.messages` value from config
 * @param reference - Built-in theme whose shape defines the valid paths
 * @returns Overrides containing only valid, sanitized messages
 */
export function validateThemeOverrides(
    rawOverrides: unknown,
    reference: ThemeMessages
): ThemeMessageOverrides {
    return validateOverrideNode(rawOverrides, reference);
}

/**
 * Compiles a custom template string into a message function.
 * Placeholders are replaced with plain string substitution - no code is evaluated.
 *
 * - A placeholder whose argument is missing renders as an empty string. When the
 *   placeholder is wrapped in its own parentheses, those (and the space before them)
 *   are removed too, so "Overwrite? ({fileName})" becomes "Overwrite?".
 * - A placeholder not in `parameterNames` is left as typed, so typos stay visible.
 *
 * @param template - Message with `{name}` placeholders, e.g. "Too long - max {maxCharacters}"
 * @param parameterNames - Placeholder name for each positional argument, in order
 * @returns Function that renders the template with the given arguments
 * @example
 * ```typescript
 * const tooLong = compileMessageTemplate("Max {maxCharacters}", ["maxCharacters"]);
 * tooLong(72); // "Max 72"
 * ```
 */
export function compileMessageTemplate(
    template: string,
    parameterNames: readonly string[]
): MessageTemplate {
    return (...templateArguments: unknown[]) =>
        template.replace(
            PLACEHOLDER_REGEX,
            (
                placeholder: string,
                openingParenthesis: string | undefined,
                name: string,
                closingParenthesis: string | undefined
            ) => {
                const argumentIndex = parameterNames.indexOf(name);
                if (argumentIndex === -1) {
                    return placeholder;
                }
                const templateArgument = templateArguments[argumentIndex];
                const isMissing =
                    templateArgument === undefined || templateArgument === null;
                if (isMissing && openingParenthesis && closingParenthesis) {
                    return "";
                }
                const value = isMissing ? "" : String(templateArgument);
                return `${openingParenthesis ?? ""}${value}${closingParenthesis ?? ""}`;
            }
        );
}

function mergeMessageNode(
    baseNode: MessageTree,
    overrideNode: unknown,
    pathPrefix: string
): MessageTree {
    const overrides = isMessageTree(overrideNode) ? overrideNode : {};
    const merged: MessageTree = {};

    for (const [key, baseValue] of Object.entries(baseNode)) {
        const overrideValue = overrides[key];
        const path = joinPath(pathPrefix, key);

        if (typeof baseValue === "function") {
            merged[key] =
                typeof overrideValue === "string"
                    ? compileMessageTemplate(
                          overrideValue,
                          TEMPLATE_PARAMETER_NAMES[path] ?? []
                      )
                    : baseValue;
        } else if (typeof baseValue === "string") {
            merged[key] = typeof overrideValue === "string" ? overrideValue : baseValue;
        } else {
            // ThemeMessages leaves are strings or functions, so anything else is a group
            merged[key] = mergeMessageNode(baseValue as MessageTree, overrideValue, path);
        }
    }
    return merged;
}

/**
 * Layers custom messages over a built-in theme.
 *
 * Every message missing from the overrides falls back to the base, so the
 * result is always a complete ThemeMessages. Override strings at template
 * paths are compiled into functions. Keys not in the base are ignored.
 *
 * @param base - Built-in theme supplying every message not overridden
 * @param overrides - Validated custom messages
 * @returns Complete message set
 */
export function mergeThemeMessages(
    base: ThemeMessages,
    overrides: ThemeMessageOverrides
): ThemeMessages {
    return mergeMessageNode(base, overrides, "") as ThemeMessages;
}
