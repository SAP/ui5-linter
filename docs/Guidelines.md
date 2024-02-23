# Development Conventions and Guidelines

## JavaScript Coding Guidelines

We enforce code style rules using [ESLint](https://eslint.org). Execute `npm run lint` to check your code for style issues.  
You may also find an ESLint integration for your favorite IDE [here](https://eslint.org/docs/user-guide/integrations).

## Testing

Unit testing is based on the [ava](https://github.com/avajs/ava) test-framework. You can run all tests using `npm test` (this is what our CI will do for all pull requests).

During development, you might want to use `npm run unit` or `npm run unit-watch` (re-runs tests automatically after file changes) to quickly execute all unit tests and see whether your change just broke one of them. 😉

## Git Guidelines

### No Merge Commits

Please use [rebase instead of merge](https://www.atlassian.com/git/tutorials/merging-vs-rebasing) to update a branch to the latest main. This helps keeping a clean commit history in the project.

### Commit Message Style

#### Commit Summary

To be decided.

#### Commit Body

To be decided.

#### Example

To be decided.

## Work on Release Branches

To be decided.

### Implementing Changes in Multiple Code Lines

To be decided.
