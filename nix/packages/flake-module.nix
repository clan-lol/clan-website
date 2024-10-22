{ self, ... }:
{
  perSystem =
    {
      pkgs,
      self',
      ...
    }:
    {
      packages.default = self'.packages.website;
      packages.website = pkgs.stdenv.mkDerivation {
        name = "website";
        src = self;
        nativeBuildInputs = [
          pkgs.npmHooks.npmConfigHook
          pkgs.nodejs
          pkgs.hugo
        ];
        buildPhase = ''
          runHook preBuild
          hugo
          runHook postBuild
        '';
        # TODO: we want the lock file instead of a checksum
        npmDeps = pkgs.fetchNpmDeps {
          src = self;
          hash = "sha256-vlRQ6UWaDFM9rqE5UaJNBDPpUl12Meu9VGernledg+0=";
          inherit (pkgs) nodejs;
        };
        installPhase = ''
          runHook preInstall
          cp -r ./public $out
          runHook postInstall
        '';
      };
    };
}
