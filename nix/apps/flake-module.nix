{
  perSystem =
    {
      lib,
      pkgs,
      self',
      ...
    }:
    let
      deployScript = pkgs.writeShellScript "deploy.sh" ''
        export PATH="${
          lib.makeBinPath [
            pkgs.coreutils
            pkgs.openssh
            pkgs.rsync
          ]
        }"
        set -euo pipefail
        tmpdir=$(mktemp -d)
        trap "rm -rf $tmpdir" EXIT

        if [ -n "$SSH_HOMEPAGE_KEY" ]; then
          echo "$SSH_HOMEPAGE_KEY" > "$tmpdir/ssh_key"
          chmod 600 "$tmpdir/ssh_key"
          sshExtraArgs="-i $tmpdir/ssh_key"
        else
          sshExtraArgs=
        fi

        cd ${self'.packages.default}
        rsync \
          --delete \
          --checksum \
          -e "ssh -o StrictHostKeyChecking=no $sshExtraArgs" \
          -a ./ \
          www@clan.lol:/var/www/clan.lol
      '';

      uploadVideoScript = pkgs.writeShellScript "upload-video.sh" ''
        export PATH="${
          lib.makeBinPath [
            pkgs.coreutils
            pkgs.openssh
            pkgs.rsync
            pkgs.gnugrep
          ]
        }"
        set -euo pipefail

        if [ $# -eq 0 ]; then
            echo "Usage: nix run .#upload-video -- <file> [file...]"
            echo "Example: nix run .#upload-video -- my-video.mp4 my-video.webm my-poster.jpg"
            exit 1
        fi

        REMOTE_HOST="www@clan.lol"
        REMOTE_PATH="/var/www/static.clan.lol/videos/"

        echo "Uploading videos to static.clan.lol..."
        rsync -avz --progress "$@" "''${REMOTE_HOST}:''${REMOTE_PATH}"

        echo ""
        echo "Upload complete! Videos are now available at:"
        for file in "$@"; do
            basename=$(basename "$file")
            echo "  https://static.clan.lol/videos/''${basename}"
        done
      '';
    in
    {
      apps.deploy.program = "${deployScript}";
      apps.upload-video.program = "${uploadVideoScript}";
    };
}
