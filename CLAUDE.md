# AGENTS.md

## Your Role
You are an expert developer
- You are fluent in front end technologies; including Typescript, HTML, and CSS.
- You are to create Typescript, HTML, and CSS as appropriate for the project

## Project Overview

Lantern Grid is a daily word-path puzzle built with **TypeScript** (strict mode), **HTML**, and **CSS**: trace words
through a 6 x 6 grid of letters to light up its squares, and try to light them all. Players can play on their own
(saved in the browser) or with a family (saved in Firebase Realtime Database, shared with Buzz Off and the other
games; see SETUP-FIREBASE.md): each player plays on their own, compares results, and combines their work when ready.

## Technologies Used

- **TypeScript** (strict mode enabled)
- **HTML5**
- **CSS3**
- **Webpack** for bundling assets
- **Firebase** (the `firebase` npm package: Auth and Realtime Database) for family play; the game's only runtime
  dependency, loaded only when family play is used
- **Node** for the build tools (word list and grids, icons, rules check) and tests only


## Project Structure
- `/src` - Main application code
  - `/src/static` - Files copied to the build unchanged (word list, grids, icons, web app manifest)
- `/tests` - Test files
- `/tools` - Build tools (word list and grids, icons, rules check), run with Node
- `/dist` - Where the build system places compiled and generated code
- `/node_modules` - Where node downloaded packages are placed

## Commands you can use
- Build Project: `npm run build`
- Run the game locally: `npm start` (http://localhost:3000)
- Run Tests: `npm run test`
- Check Style: `npm run lint` (checks only; does not change files)
- Fix Style: `npm run lint:fix` (automatically fixes what it can)
- Rebuild the word list and grids: `npm run build:puzzles` (changes answers; see design/decisions.md first)
- Rebuild the icons: `npm run build:icons`
- Check the Firebase security rules against the real project: `npm run check:rules`

## Code Style Instructions
- Use TypeScript strict mode
- Prefer functional style code
- Prefer clarity over cleverness
- Keep solutions maintainable and readable
- Prefer putting each Typescript type/interface definition in it's own file (named after the type/interface)
- Typescipt files must have content in the order of
  - `import` statements
  - A comment in TSDoc format describing the file, what the code in it is and what it is for
  - Any static variables used in the file
  - The `type` or `interface` definition, if there is one in that file
  - Any other functions defined in that file
- Typescript files must have no more than a single type definition
- When adding or updating a Typescript fuction, add/update an explanation of the function in TSDoc format, directly preceeding the function that is being explained
- For Typescript, use an indent size of 4 spaces
- Typescript files should have a comment at the top explaining their purpose.

### Code Style Files/Formats
- Code Tools: `eslint` and `prettier`
- Code Files: Code style check output is written to `eslint-results.json`
  - The file is in JSON format

### Running Code Style Checks
- After making any code changes, always run a full style check using the specified Check Style command
- Always ensure the style check passes after all intended changes are complete


## Automated Testing Instructions

### Testing Files/Formats
- Test files are in `/tests/`, named `*.test.ts`
- Tests are written to `jest-results.json`
  - The file is in JSON format; failed tests are in `testResults[].assertionResults[]` with status "failed"

### Adding and Running Tests
- When adding new code or refactoring, always add or update automated unit tests for the affected functions or modules.
- Place new or updated tests in the tests directory, following the naming convention *.test.ts and mirroring the source file structure when possible.
- After making any code changes, always run the full test suite using the specified test command to ensure:
  - All new tests pass.
  - No pre-existing tests are broken by the change (unless explicitly allowed, see below).

### Handling Expected Test Failures

- If a code change intentionally breaks a pre-existing test (e.g., due to a requirements change), do NOT simply remove or skip the test.
- Instead, update the test to reflect the new expected behavior, and document the reason for the change in the test file as a comment.
- If a test must temporarily fail (e.g., for staged rollouts), clearly comment in the test file why the failure is expected and when it should be fixed.
- Always ensure the test suite passes after all intended changes and test updates are complete.


## Boundaries

### Always Allowed
- Read files in project
- Creating files in `/src/**`
- Updating files in `/src/**`
- Building project
- Running tests

### Ask first
- Installing packages
- Deleting files
- Anything that adds a service, or could cost money
- Changing `database.rules.json` (it protects every game's data, Buzz Off's too; keep the copies in all the games'
  projects the same, and run `npm run check:rules` after publishing a change)
- Changing the shared family code (see design/code-design.md, "Shared with the other games"): the same files are in
  each game's project, and should stay the same
- Changing any other project (Buzz Off and the other games, in `D:\Development\Code\`): each has its own Claude
  session; say what needs changing there, and add it to design/todo.md

### Never
- Interacting with git / github (I want to do with manually for now)

### Design

- Start with @design/overview.md - what the game is, where the project stands, the plan, and what can be tuned
- See @design/game-design.md - information about the design of the game itself - what the different features are, how the interact, etc
- See @design/code-design.md - the way the code is layed out in the directory, what code can do what, etc
- See @design/family-and-database.md - how family play works and is shared with Buzz Off and the other games: the
  database layout, security rules, sign-in, invites, the shared code and how the game plugs into it
- See @design/decisions.md - a dated log of design/architecture decisions: what was decided, when, and why
- See @design/todo.md - known work that still needs doing: fixes, cleanup, follow-ups, and planned features
- See `design/how-the-game-works.md` - plain-language explanation of how the game works, for people reading the
  source; update it when a feature players would notice changes
- The in-game How to Play screen (`src/typescript/ui/help.ts`) is written for players; update it when a feature players
  would notice changes

### Recording Decisions
- When a design or architecture decision is made (or an existing one changes), update the relevant file in `design/`
  and add an entry to `design/decisions.md`, following the format described at the top of that file
- Mark older entries that a new decision replaces as superseded; never delete entries
- Unresolved questions go in the "Open Questions" section of the relevant design file
- Known work that isn't being done right away (bugs, cleanup, follow-ups) goes in `design/todo.md`; remove items when
  they are done
