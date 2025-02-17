+++
title= "nix-select"
subline= "a pure and lazy query language in nix"
date= 2025-02-17T00:08:10+02:00
author= "Lassulus"
tags = ['Info']
+++

Find it at: [https://git.clan.lol/clan/select](https://git.clan.lol/clan/select)

Do you find accessing values from lists cumbersome? Is `builtins.elemAt` bringing you down? What about filtering nested dictionaries for specific keys?

For this reason, we hacked together an unmatched selection experience. It is written in pure Nix, without dependencies, to make your life 100% more "selectful."

To use `nix-select` with the `clan` CLI, just run `clan select`.

### Prominent features include:
- Globs: `*`
- `{a,b}` (set-based selection)
- `.0` (index-based access)

### Example using the Clan CLI:

```sh
clan select 'nixosConfigurations.*.config.clan.core.vars.generators.*.files.*.{path,secret}'
```

This will print all variables defined in your Clan.

Here’s the equivalent non-selectful expression:

```nix
builtins.mapAttrs (
  _: v0:
  builtins.mapAttrs (
    _: v1:
    (builtins.mapAttrs (
      _: v3:
      builtins.intersectAttrs {
        path = { };
        secret = { };
      } v3
    ) v1.files)
  ) v0.config.clan.core.vars.generators
) nixosConfigurations
```

`clan select` also uses a transparent caching technique, so running the same command again will be significantly faster.

There are many more operators and constructs supported in `nix-select`, all of which are documented in the [README](https://git.clan.lol/clan/select).

---

## Usage Without Clan

You can also import our 100% pure Nix library and use it directly in your project today!

To use it inside any `nix repl`:

```nix
nix-repl> select = (builtins.getFlake "github:clan-lol/select").lib.select
```

With this, the `select` function can be used by simply passing it a query string and an attribute set or list:

```nix
nix-repl> select "*.config.networking.hostName" nixosConfigurations
```

The query language is intentionally designed to be compatible with the Nix grammar, so it might be possible to extend the Nix expression language to improve ease of use.
