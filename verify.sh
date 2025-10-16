set -euo pipefail

PROXIES=(
  0x8Cd56e96BA5b04e6960B2257C937E175B91AA31c
  0xD75e3FBb2C092181110eE23a4763D701EA61c294
  0x3C3216bCDEe8b85cA82222Ed251A7bd765569b4E
  0x58b8661801C2AAe8E9E7A5028acc30fad19C23d0
  0xfC01208ffF34C3987431d15fEEE23444F11A8317
)

VERIFIER=https://server-verify.hashscan.io/api
REPO=https://repository-verify.hashscan.io/contracts
CHAIN=296
SOLC=0.8.24
FQN=node_modules/@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy

check() {
  local a=$(printf '%s' "$1")
  curl -sfI "$REPO/full_match/$CHAIN/$a/metadata.json" >/dev/null && { echo FULL; return; }
  curl -sfI "$REPO/partial_match/$CHAIN/$a/metadata.json" >/dev/null && { echo PARTIAL; return; }
  echo NONE
}

submit() {
  local a=$(printf '%s' "$1")
  forge verify-contract \
    --verifier sourcify \
    --verifier-url "$VERIFIER" \
    --chain-id "$CHAIN" \
    --compiler-version "$SOLC" \
    "$a" \
    "$FQN" || true
}

for a in "${PROXIES[@]}"; do
  echo "=== $a ==="
  s=$(check "$a"); echo "Before: $s"
  if [ "$s" = "FULL" ] || [ "$s" = "PARTIAL" ]; then
    echo "✓ Already on repo"; continue
  fi

  submit "$a"

  # Poll a few times; HashScan’s server sometimes responds with empty body but stores it
  for i in {1..6}; do
    sleep 4
    s=$(check "$a")
    if [ "$s" != "NONE" ]; then
      echo "After: $s ✓"
      break
    fi
    echo "retry $i…"
    submit "$a"
  done

  s=$(check "$a")
  [ "$s" = "NONE" ] && echo "✗ Still not on repo. Try again from another network or later."
done
