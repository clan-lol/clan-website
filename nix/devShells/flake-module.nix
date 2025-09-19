{ inputs, ... }:
{
  imports = [
    inputs.process-compose.flakeModule
  ];

  perSystem =
    {
      pkgs,
      ...
    }:
    {

      process-compose.dev = {
        settings.processes = {
          css = {
            command = "tailwindcss -i assets/css/main-input.css -o assets/css/main.css --watch";
            # tailwindcss --watch expects a tty otherwise it stops immediately
            is_tty = true;
            # wait for first build
            ready_log_line = "Done in";
          };
          hugo = {
            command = "hugo server -D -F";
            # wait for first build of css before starting
            depends_on.css.condition = "process_log_ready";
          };

        };
      };

      devShells.default = pkgs.mkShellNoCC {
        nativeBuildInputs = with pkgs; [
          importNpmLock.hooks.linkNodeModulesHook
          hugo
          nodejs
        ];
        npmDeps = pkgs.importNpmLock.buildNodeModules {
          npmRoot = ../..;
          inherit (pkgs) nodejs;
        };
      };
    };
}
