# Implementation Plan

## Overview

Fix the layout so the map touches the bottom of the viewport:

- Page height locked to viewport (100vh)
- Map fills remaining space after header (100vh - 20px top margin - 100px header)
- 20px margins on left/right of viewport
- Map has no border-radius
