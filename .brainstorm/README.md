# Brainstorm Build Package

This directory contains everything needed to implement the product spec designed in Brainstorm.

## Quickstart

Paste this into your AI coding tool (Claude Code, Cursor, Copilot, Aider, or similar):

    Implement this product following @.brainstorm/BUILD.md

## Contents

    .brainstorm/
      BUILD.md                    Paste @-reference to this into your AI tool
      spec.md                     Full build specification
      design/                     Vision, design docs, look-and-feel, journey map
      stories/                    Story cards with acceptance criteria
      collateral/                 Uploaded reference files and approved mockups (if any)
      build-report-schema.yaml    Expected format for the build report
      prompts/                    Phase-specific prompts (optional, for phased workflows)

## Build Report

When the build is done, create `.brainstorm/build-report.yaml` per `build-report-schema.yaml`. Upload this file in your Brainstorm product page (build card → drag and drop) to track progress and run a debrief.

## Commit Convention

Every implementation commit should include the story slug in brackets:

    [story-001-login] add auth middleware and session handling
