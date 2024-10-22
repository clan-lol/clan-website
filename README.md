# Build website

```
$ nix build
```

# Serve website

```
$ nix develop -c hugo server
```

# Deploy website

```
$ nix run .#deploy
```

Website also auto-deploys everytime commits are added to master.
