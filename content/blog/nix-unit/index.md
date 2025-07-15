+++
title = "nix-unit"
subline = "Testing Nix evaluation logic with nix-unit"
date = 2025-07-08T08:00:00+00:00
draft = false
author = "Kenji Berthold"
tags = ['Dev Report']
+++

When building robust Nix-based systems, testing your evaluation logic becomes crucial. Especially since the module system is flexible and can be used in many ways. One of the ways we test our Nix logic is `nix-unit`.

## What is nix-unit?

[nix-unit] is a testing framework specifically designed for testing Nix expressions. It's design makes it ideal to test pure functions, module system configurations and even more complex evaluation logic. It scales well and is fast.

Some notable features:
- **Fast feedback loops**: 
Tests run at evaluation time, not build time.
- **Pure function testing**: 
Perfect for testing Nix library functions.
- **Assertion Based Testing**: 
The expression that is expected can be directly declared in Nix.
- **Diff Integration**
Diff integration on error failure makes spotting errors very quick.
- **Testing errors**: 
Is able to tests and assert on evaluation errors.
It can test failures individually, even if the failure is caused by an evaluation error.

The above features are some of the reasons we use it to test our infrastructure on various granularities. Let us look into how a basic test structure would look like.

### Basic Test Structure

A `nix-unit` test is a Nix attribute set, that has an expression that should be tested (expr) and it's expected outcome (expected). The name of the attribute set should be prefixed with `test`.

```nix
{
  test_answer = {
    expr = builtins.add 40 2;
    expected = 42;
  };
}
```

We can now also test error cases.

```nix
{
  test_error = {
    expr = throw "10 instead of 5";
    expectedError.type = "ThrownError";
    expectedError.msg = "\\d+ instead of 5";
  };
}
```

Notice how the error message even has regex support?


### Grouping

The expressions can be directly declared in Nix and we can test nested attribute sets. This means grouping of hierarchical tests has a good UX.

```nix
{
  feature_1 = {
    test_bar = {
      expr = "bar";
      expected = "bar";
    };
  };
  feature_2 = {
    test_foo = {
      expr = "foo"
      expected = "foo";
    };
    test_foo_set = {
      expr = { x = "foo"; };
      expected = { x = "foo"; };
    };
  };
}
```
Here we test 2 different features, one which has 1 test and one feature which has 2 tests.

### Interactive debugging

Since `nix-unit` tests Nix expressions in an attribute set, we can use the default Nix repl to evaluate and inspect the tests Interactively.

If we have our first test in a file called `answer.nix`:
```shellSession
$ nix repl
Nix 2.29.1
Type :? for help.
nix-repl> test = import ./answer.nix {}

nix-repl> test
{
  test_answer = { ... };
}

nix-repl> tests.test_answer.expr
42
```


[nix-unit] is fast, flexible and has good UX.

## Integration with CI
While [nix-unit] on its own is a valuable tool, a project might want to integrate such functionality into it's CI pipeline.

To make this seamless we need to evaluate Nix inside the Nix build sandbox. Or in other words `nix-unit` should be wrapped inside a derivation.

This has mainly two benefits:
- When we have a Nix based CI, we can build it anywhere leveraging Nix's determinism.
- We can cache the derivation if there are no changes to the test, or the base logic. Meaning we don't need to re-run the tests.

To make this work is non-trivial and when we originally started using `nix-unit` we hooked everything up manually.

But now [nix-unit] exposes a [flake-parts] module, which does this integration for you.

## Integration with flake-parts

Why would you want to integrate with [flake-parts]?

In addition to creating a wrapped derivation of `nix-unit`, it allows to structure your flake in a more composable way.
The tests and logic can both be part of a module, meaning the tests live where the module lives.
In a larger codebase your tests are now more discoverable and the proximity to the logic makes them easier to maintain.

## You can do it too
Here are the steps required, if you want to try it out yourself:
- Have a flake with [flake-parts]
- Add `nix-unit.url = "github:nix-community/nix-unit";` to your inputs
- Create a `tests.nix` file with the following content:
```nix
{
  flake.tests = {
    test_answer = {
      expr = builtins.add 40 2;
      expected = 42;
    };
  };
}
```
- Add the test file and the flake-parts module to your imports:
```nix
imports = [
    inputs.nix-unit.modules.flake.default
    ./test.nix
];
```

And now you can test your functions and logic to your hearts content!

The test will be automatically added to the `checks` attribute running the tests when you run `nix flake check`.


[nix-unit]: https://github.com/nix-community/nix-unit
[flake-parts]: https://github.com/hercules-ci/flake-parts
