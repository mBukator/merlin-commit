# Themes

Merlin Commit ships with two UI themes, and you can build a custom theme on top of either one. Every theme produces identical commit messages - the theme only affects the prompt text and visual decoration.

---

## The Wizard Theme (Default)

The wizard theme uses magical vocabulary, emoji decorations, and color to make the commit workflow feel distinct and memorable.

**Commit prompts (wizard):**

```
🧙 Merlin awaits your command...

? 🪄 Choose the type of spell:
❯ ✨  feat          A new feature visible to users
  🐛  fix           ...

? 🎯 What domain does this affect? (optional)

? 📝 Describe your spell briefly:
(0/72) _

? 📖 Would you like to weave a detailed tale? (y/N)

? ⚠️ Does this spell shatter ancient contracts? (y/N)

? 🔗 Does this resolve any quests? (y/N)

? 🔮 Shall Merlin cast this spell? (Y/n)

✓ Spell cast! [abc1234] feat(auth): add login
```

**Config prompts (wizard):**

```
? Which configuration would you like to edit?
❯ User config (applies to all repos - ~/.merlinrc.json)
  Project config (applies to this repo - .merlinrc.json)
```

**Init prompts (wizard):**

```
🧙 Merlin will bless your realm with commit guardians

? 📦 Summon husky and commitlint from the ether? (Y/n)
? 🔗 Bind 'git merlin' to your spellbook? (y/N)
? 📜 Create a realm tome for team sharing? (y/N)
```

**Vocabulary:** The wizard theme uses thematic synonyms for common concepts. See [Glossary](../GLOSSARY.md) for the full vocabulary map.

---

## The Standard Theme

The standard theme uses plain, direct language with no thematic vocabulary or decorative emoji. It is easier to read quickly and has no dependency on emoji rendering.

**Commit prompts (standard):**

```
? Select the type of change:
❯ feat      A new feature visible to users
  fix       ...

? Scope (optional):

? Short description:
(0/72) _

? Add a detailed description? (y/N)

? Are there any breaking changes? (y/N)

? Reference any issues? (y/N)

? Create this commit? (Y/n)

✓ Commit created: [abc1234] feat(auth): add login
```

**Config prompts (standard):**

```
? Which configuration would you like to edit?
❯ User config (applies to all repos - ~/.merlinrc.json)
  Project config (applies to this repo - .merlinrc.json)
```

---

## When to Use Each Theme

| Use the wizard theme when...                                                      | Use the standard theme when...                                       |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| You are working in a modern terminal (Windows Terminal, iTerm2, Alacritty, Kitty) | Your terminal has poor emoji support                                 |
| You want a distinctive commit experience                                          | You prefer minimal, fast prompts                                     |
| You enjoy the thematic vocabulary                                                 | You work in VS Code's integrated terminal and find emoji spacing off |
| You are onboarding developers who are new to conventional commits                 | Accessibility requirements prefer plain text                         |

---

## Switching Themes

### Via the config menu

```bash
merlin config
# → User config → Theme → standard (or wizard)
```

### Via config file

Edit `~/.merlinrc.json` (user, applies everywhere) or `.merlinrc.json` (project, overrides user):

```json
{
    "theme": "standard"
}
```

The theme takes effect immediately - no restart needed.

---

## Custom Themes

A custom theme takes one of the built-in themes as its base and replaces only the messages you list. Everything you leave out comes from the base theme, so new messages added in later Merlin versions never break your theme.

```json
{
    "theme": "custom",
    "customTheme": {
        "extends": "wizard",
        "messages": {
            "commit": { "intro": "🚀 Ready to launch your commit!" },
            "prompts": {
                "type": "🎯 Select mission type:",
                "confirm": "🛰️ Launch this commit?"
            },
            "errors": {
                "commit": {
                    "tooLong": "Payload too heavy - max {maxCharacters} characters"
                }
            }
        }
    }
}
```

| Field                  | Description                                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| `theme`                | Set to `"custom"` to use `customTheme`. Other values ignore `customTheme`.                                 |
| `customTheme.extends`  | `"wizard"` or `"standard"`. Supplies every message you don't override, and decides decoration (see below). |
| `customTheme.messages` | Nested object of messages to replace. Keys mirror the reference table below.                               |

You can also pick the theme from the menu: `merlin config` → Theme → `custom`. The messages themselves are edited in `.merlinrc.json`.

### Decoration follows the base

`extends` decides more than the fallback text. With `"wizard"` as the base, the type picker shows emoji columns and the config menu shows emoji icons. With `"standard"`, both use plain labels. Your own messages can contain any emoji either way.

### Template messages

Three messages take a value at runtime. Write them as strings with `{placeholder}` tokens:

| Key                         | Placeholder       | Example                                     |
| --------------------------- | ----------------- | ------------------------------------------- |
| `config.projectFieldAction` | `{field}`         | `"What should happen to {field}?"`          |
| `errors.commit.tooLong`     | `{maxCharacters}` | `"Too long - max {maxCharacters}"`          |
| `init.overwrite`            | `{fileName}`      | `"Already exists. Overwrite? ({fileName})"` |

- `init.overwrite` is sometimes shown without a file name. The placeholder then renders as empty, and parentheses left empty are removed, so the example above becomes `Already exists. Overwrite?`.
- A placeholder Merlin doesn't know (for example a typo like `{maxChars}`) is shown exactly as typed, so the mistake is easy to spot.
- Placeholders are plain text substitution. Nothing in a theme is ever run as code.

### Validation and limits

A custom theme is checked when the config loads. Invalid parts are dropped silently, the same way as other config fields:

- Keys that don't exist in the reference table are ignored.
- Values must be strings. Numbers, arrays and objects in place of a message are ignored.
- Control characters (including the escape characters used for terminal colour and cursor codes) and right-to-left override characters are stripped, so a shared config can't send commands to your terminal or disguise prompt text.
- Messages are cut to 200 characters (counted so an emoji is never split in half).
- If the `customTheme` in a file is invalid (for example `extends` isn't `"wizard"` or `"standard"`), that file's `customTheme` is ignored. Merlin then uses the `customTheme` from the next config level down - project, then user - or, if none is valid, the plain wizard theme.
- Saving settings from `merlin config` never rewrites your `customTheme` block, so a typo in it is left for you to fix rather than silently dropped from the file.

### Sharing a theme with your team

Put `theme` and `customTheme` in the project `.merlinrc.json` and commit it. Project config replaces user config field by field, so a project `customTheme` replaces your personal one as a whole - the two are not merged message by message.

### Message key reference

Every key a custom theme can override, with the standard theme's text. Template placeholders are shown in braces.

| Key                               | Standard text                                                |
| --------------------------------- | ------------------------------------------------------------ |
| `commit.intro`                    | Ready to create a commit                                     |
| `commit.exit`                     | Commit complete                                              |
| `commit.dryRunExit`               | Dry run complete - no commit was created.                    |
| `commit.previewHeader`            | Commit Preview:                                              |
| `config.intro`                    | Configuration settings                                       |
| `config.exit`                     | Configuration closed                                         |
| `config.scopeSelector`            | Edit configuration scope:                                    |
| `config.scopeUser`                | User config (applies to all repos - ~/.merlinrc.json)        |
| `config.scopeProject`             | Project config (applies to this repo - .merlinrc.json)       |
| `config.noProjectConfig`          | No project config found.                                     |
| `config.createProjectConfig`      | Create .merlinrc.json for this repo?                         |
| `config.projectConfigCreated`     | Created .merlinrc.json                                       |
| `config.projectFieldAction`       | Action for {field}:                                          |
| `config.back`                     | Returning to scope selection...                              |
| `checking.repo`                   | Checking git repository                                      |
| `checking.staged`                 | Checking staged changes                                      |
| `checking.unstaged`               | Checking unstaged files                                      |
| `checking.autoAdd`                | Staging selected files...                                    |
| `prompts.type`                    | Select the type of change:                                   |
| `prompts.scope`                   | Scope (optional):                                            |
| `prompts.subject`                 | Short description:                                           |
| `prompts.body`                    | Add a detailed description?                                  |
| `prompts.breaking`                | Are there any breaking changes?                              |
| `prompts.issues`                  | Reference any issues? (e.g., fixes #123)                     |
| `prompts.confirm`                 | Create this commit?                                          |
| `prompts.selectFiles`             | Select files to stage:                                       |
| `success.commit.created`          | Commit created successfully                                  |
| `success.commit.amended`          | Commit amended successfully                                  |
| `success.commit.dryRun`           | Preview mode - no commit created                             |
| `success.config.saved`            | Configuration updated                                        |
| `success.init.completed`          | Setup complete                                               |
| `errors.notRepo`                  | Not a git repository                                         |
| `errors.commit.noStaged`          | No staged changes found                                      |
| `errors.commit.required`          | This field is required                                       |
| `errors.commit.tooLong`           | Text exceeds maximum length (max {maxCharacters} characters) |
| `errors.commit.malformed`         | Invalid format                                               |
| `errors.commit.commitFailed`      | Failed to create commit                                      |
| `errors.commit.editorFailed`      | Editor exited with error                                     |
| `errors.init.noPackageJson`       | No package.json found                                        |
| `errors.init.installFailed`       | Failed to install dependencies                               |
| `errors.init.huskyFailed`         | Failed to initialize husky                                   |
| `errors.init.hookFailed`          | Failed to create commit-msg hook                             |
| `errors.init.configFailed`        | Failed to create commitlint config                           |
| `errors.init.aliasFailed`         | Failed to create git alias                                   |
| `warnings.cancel`                 | Commit cancelled                                             |
| `warnings.commit.noVerify`        | Skipping git hooks (--no-verify)                             |
| `warnings.config.resetConfig`     | This will reset all configuration to defaults                |
| `warnings.config.noProjectConfig` | No git repository detected - project config is not available |
| `warnings.init.existingSetup`     | Existing setup detected:                                     |
| `warnings.init.aliasExists`       | Git alias 'merlin' already exists                            |
| `tips.commit.gitAdd`              | Use "git add <file>" to stage changes                        |
| `tips.init.runGitInit`            | Run "git init" to initialize a repository                    |
| `tips.init.runNpmInit`            | Run "npm init" to create a package.json                      |
| `tips.init.manualInstall`         | Install manually: npm install -D                             |
| `tips.init.nextSteps`             | Setup complete! Next steps:                                  |
| `init.intro`                      | Setting up conventional commits for your repository          |
| `init.checkingPackageJson`        | Checking for package.json                                    |
| `init.installDeps`                | Install husky and commitlint dependencies?                   |
| `init.installingDeps`             | Installing dependencies...                                   |
| `init.initializingHusky`          | Initializing husky...                                        |
| `init.creatingHook`               | Creating commit-msg hook...                                  |
| `init.creatingCommitlint`         | Creating commitlint config...                                |
| `init.setupAlias`                 | Setup 'git merlin' alias?                                    |
| `init.aliasScope`                 | Select alias scope:                                          |
| `init.creatingAlias`              | Creating git alias...                                        |
| `init.skipExisting`               | Skipping existing file:                                      |
| `init.overwrite`                  | File already exists. Overwrite? ({fileName})                 |
| `init.aliasScopeGlobal`           | Global (all repositories)                                    |
| `init.aliasScopeLocal`            | Local (this repository only)                                 |
| `init.createProjectConfig`        | Create project config (.merlinrc.json) for team sharing?     |
| `init.creatingProjectConfig`      | Creating project config...                                   |
| `init.exit`                       | Repository setup complete.                                   |

<p align="center">
  <img src="../../.github/assets/gif-03-theme-switch.gif" alt="switching themes" width="100%" />
</p>

---

## Terminal Compatibility

### Windows Terminal / iTerm2 / Alacritty / Kitty

Full emoji support. The wizard theme renders as intended, with proper emoji column widths.

### VS Code Integrated Terminal

VS Code uses xterm.js, which renders some emoji (those followed by the Unicode variation selector U+FE0F) as a single column wide instead of two columns. This can cause misaligned text in the type selector.

Merlin detects VS Code automatically via the `TERM_PROGRAM` environment variable and adjusts emoji spacing accordingly. If you notice alignment issues in VS Code, this detection is the mitigation.

### Other terminals (PuTTY, older xterm)

Emoji support varies. If the wizard theme displays garbled characters or misaligned columns, switch to the standard theme:

```json
{
    "theme": "standard"
}
```

### Windows Command Prompt / PowerShell (legacy)

The standard theme is recommended. Color support is present in Windows Terminal but may be absent in `cmd.exe` or older PowerShell versions.

---

## Colors

Both themes use terminal colors for feedback, independent of the theme setting:

| Color  | Used for                                         |
| ------ | ------------------------------------------------ |
| Cyan   | Section headers and primary labels               |
| Green  | Success messages                                 |
| Red    | Error messages, character counter overflow       |
| Yellow | Warnings, character counter approaching limit    |
| Blue   | Informational messages                           |
| Gray   | Secondary text, character counter (normal state) |
| White  | Main content                                     |

Color output requires a terminal that supports ANSI escape codes. Colors are not affected by the theme choice.

---

## Related

- [Glossary](../GLOSSARY.md) - Complete wizard-theme vocabulary reference
- [Config Schema](../reference/config-schema.md#customtheme) - `customTheme` field reference
- [Configuration](../reference/configuration.md) - Setting a default theme and other options
- [CLI Reference](../reference/cli-reference.md) - The `merlin config` command
