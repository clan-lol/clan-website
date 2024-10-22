{ inputs, ... }:
{

  imports = [ inputs.treefmt-nix.flakeModule ];

  perSystem =
    { ... }:
    {
      treefmt = {
        # Used to find the project root
        projectRootFile = ".git/config";

        programs.deadnix.enable = true;
        # programs.deno.enable = true;
        # TODO:
        #programs.prettier.enable = true;
        #programs.prettier.settings = {
        #  plugins = [
        #    "${pkgs.prettier-plugin-go-template}/lib/node_modules/prettier-plugin-go-template/lib/index.js"
        #  ];
        #  overrides = [
        #    {
        #      files = [ "*.html" ];
        #      options.parser = "go-template";
        #    }
        #  ];
        #};
        programs.nixfmt.enable = true;
        programs.shellcheck.enable = true;

        settings.formatter.shellcheck.options = [
          "--external-sources"
          "--source-path=SCRIPTDIR"
        ];

        programs.shfmt.enable = true;

        settings.global.excludes = [
          "*.min.js"
          "*.otf"
          "*.jpg"
          "*.png"
          "*.mkv"
          "*.ove"
          "*.cast"
          "*.svg"
          "*.webp"
          "static/css/asciinema-player.css"
          "assets/css/main.css"
        ];
      };
    };
}
