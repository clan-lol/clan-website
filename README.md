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

# Upload videos

Videos are hosted on https://static.clan.lol and should not be committed to the repository.

To upload videos:

```
$ nix run .#upload-video -- my-video.mp4 my-video.webm
```

Videos will be available at `https://static.clan.lol/videos/<filename>`.

To reference videos in blog posts, use the `video` shortcode:

```
{{< video key="my-video" poster="my-poster.jpg" autoplay="true" muted="true" loop="true" >}}
```

This will automatically load `my-video.webm`, `my-video.mp4`, and `my-video.ove` from static.clan.lol.

[process-compose]: https://f1bonacc1.github.io/process-compose/
[process-compose-flake]: https://github.com/Platonic-Systems/process-compose-flake