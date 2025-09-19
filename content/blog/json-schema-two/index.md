+++
title= "Why NixOS Modules Need Two JSON Schemas"
subline= "Bridging NixOS modules and JSON Schema: safer configs, fewer type guards, stronger guarantees."
date = 2025-09-18T09:11:39+02:00
draft = false
author = "hsjobeki"
tags = ['Dev Report']
+++

## Why NixOS Modules Need Two JSON Schemas

In our previous blog posts, we explored a techinque that extracts interfaces from NixOS modules and converts them into JSON schemas. This enables building GUIs and APIs that can shallowly validate NixOS configurations without running Nix itself.
Our second post explored the broader challenge of maintaining type-safe interfaces across polyglot architectures - specifically how to share consistent data models between Nix, Python, and TypeScript in the Clan project's tech stack.

- [Introducing the NixOS to JSON Schema Converter](https://clan.lol/blog/json-schema-converter/)
- [The Challenge of Polyglot Architectures](https://clan.lol/blog/interfaces/)

## The New Discovery

While implementing these JSON schema-based types/interfaces in production, we discovered a subtle but important issue: we actually need two different JSON schemas for each NixOS module, not just one.

When using JSON Schema for type validation at build-time and runtime, the approach proved surprisingly stable for building our tech stack.
However, we noticed subtle usage differences that create unnecessary complexity.

The issue stems from how the NixOS module system behaves as a transformation layer.
While one might expect that input configuration equals output configuration (since the module system is a fixed point),
there's a notable difference that causes unnecessary type guarding when consuming or producing data.

An example:

```nix
{
   options.foo = mkOption {
       type = types.anything;
       default = 42;
   };
}
```

(Types in [CUE lang](https://cuelang.org/docs/tour/types/structs/) )

| Schema | Purpose                       | Example   |
| ------ | ----------------------------- | --------- |
| Write  | What user/program provides    | `foo?: _` |
| Read   | What module system guarantees | `foo: _`  |

This difference is inherent because the module system applies *defaults*, *merges*, does *coercions*, and *normalization*. That turns a potentially partial configuration into a total one.

This subtle difference causes unnecessary type guards in our Python code currently.

For example

```python
foo: Foo = read_data()

# Unnecessary typeguard
# Because foo cannot be be None in the `read`-schema
if foo is not None:
     # Do something with foo
     pass
```

The same goes on for the whole stack. I.e the Typescript frontend also suffers from the same problem.
As well as everything that calls the API's in a typesafe manner.

We use only the *write* format for everything. which is safe because it is possibly a supertype of the *read* format. Supertype here just means "more permissive", it accepts more inputs than the read schema.

I need to put more research into the question of which option types are strict supertypes, which would allow us to utilize that property of the system.

This is a non-trivial question because it ties into how the module system’s types work and requires verifying every option type that exists or some property about option types.

Another example: `lib.types.coercedTo A to B`, which transforms the value into another value.
This can be represented as:

| Schema | Purpose                       | Example   |
| ------ | ----------------------------- | --------- |
| Write  | What user/program provides    | `foo?: A \| B` |
| Read   | What module system guarantees | `foo: B`  |

In type-theory terms, this means the `read` schema is a subtype of the `write` schema. In practice, this gives us two big wins.

We could either formally prove this for all types, or restrict our usage such that this is always true, so we gain the following:

## (a) Safe round-tripping

Any resolved configuration (read) is *also valid input* (write).
That means we can:

* serialize the *read* config,
* feed it back into the module system as input,
* and get the *same* or *equivalent* resolved config.

This is valuable for reproducibility, migration tooling, and debugging.

If `read` were not a subtype of `write`, round-tripping would break. We could resolve a config, but not be able to reapply it as input without errors.

## (b) Compatibility & stability checks

We can turn `read ⊑ write` into a **CI invariant**:

* If we change module options, we check whether the *new read schema* is still a subtype of the *old write schema*.
* If yes; no breaking change for existing configs.
* If no; flag it as breaking change.
That's a strong formal guarantee that configuration evolution won't silently invalidate existing setups. This is a possible future idea.

## What if not a subtype?

If `read` is *not* a subtype of `write`, then:

* Developers are still safe, they always rely on `read` or `write` only.
* But we lose our important **round-tripping**: some values you get from the system can't be expressed as valid inputs.
* We also lose version compatibility checks: breaking schema evolution can't be detected so easily anymore.

In practice, that would mean more ad-hoc checks and possibly more subtle breakages when integrating different stacks.

## Practical takeaway

* We should start exporting two schemas, to more closely represent the nature of the system:
  * Ensure that all consumers see consistent, reliable types, that closely represent the data.
* Always use read schema for reading; For Python developers this means they can drop some type guards and possibly other noise.
* If we enforce `read ⊑ write` we gain important ergonomics:
  * We can safely serialize/reserialize configs (roundtrip property).
  * We get a cheap and strong compatibility invariant for free.
  * We can trust read values as valid inputs everywhere.

## Outlook

`types.deferredModule` breaks with the round-tripping property entirely.

But in clan we use these in a couple of api-facing places. In the next post, I'll dive into this case and show how I built a solution to restore those properties and make deferred modules api-usable.
