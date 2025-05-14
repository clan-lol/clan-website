# Build website

```
$ nix build
```

# Serve website

We use [process-compose] via [process-compose-flake] for running local dev services.

```
$ nix run .#dev
```

# Deploy website

```
$ nix run .#deploy
```

Website also auto-deploys everytime commits are added to master.

[process-compose]: https://f1bonacc1.github.io/process-compose/
[process-compose-flake]: https://github.com/Platonic-Systems/process-compose-flake