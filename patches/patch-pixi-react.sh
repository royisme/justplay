#!/bin/bash
# Patch @pixi/react for React 19 ESM compatibility
# See: https://github.com/pixijs/pixi-react/issues/630

PIXI_REACT_DIR="node_modules/@pixi/react/lib"

if [ -d "$PIXI_REACT_DIR" ]; then
  echo "Patching @pixi/react for React 19 ESM compatibility..."

  # Fix store.mjs
  if [ -f "$PIXI_REACT_DIR/store.mjs" ]; then
    sed -i.bak "s/from 'react-reconciler\/constants'/from 'react-reconciler\/constants.js'/g" "$PIXI_REACT_DIR/store.mjs"
    rm -f "$PIXI_REACT_DIR/store.mjs.bak"
  fi

  # Fix resolveUpdatePriority.mjs
  if [ -f "$PIXI_REACT_DIR/helpers/resolveUpdatePriority.mjs" ]; then
    sed -i.bak "s/from 'react-reconciler\/constants'/from 'react-reconciler\/constants.js'/g" "$PIXI_REACT_DIR/helpers/resolveUpdatePriority.mjs"
    rm -f "$PIXI_REACT_DIR/helpers/resolveUpdatePriority.mjs.bak"
  fi

  echo "Patch applied successfully!"
else
  echo "Warning: @pixi/react not found, skipping patch"
fi
