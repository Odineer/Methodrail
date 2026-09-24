# Harness location

Resolve placement before the first write. The harness is always addressed through `<git-root>/.methodrail/`; that canonical path is either a directory in the repository or a locally ignored link to external storage.

Never discover a harness by choosing an arbitrary sibling or workspace folder. Linked storage is valid only when the repository-root link and `HARNESS.yaml` agree.

## Ask when needed

Ask only when `.methodrail` does not exist and the user has not already chosen. Honor a stated preference without re-asking.

```text
Where should Methodrail project knowledge live?

1. In this repository — a normal `.methodrail/` directory that may be committed.
2. Outside this repository — sibling storage exposed through a locally ignored `.methodrail` link, so it does not appear in commits or PR review.
```

Do not add `.methodrail` to the tracked `.gitignore`. Linked placement uses Git's local exclude file.

## In the repository

Create `.methodrail/` at the Git root. Use the repository's established native locations for any project-specific skills or thin host integration.

Done when `.methodrail/PROJECT.md` is readable at the Git root and generated files pass normal validation.

## Linked external storage

Default physical folder: a sibling of the Git root named `<repo-name>-methodrail`.

```text
<parent>/
  my-app/
    .git/
    .methodrail -> ../my-app-methodrail/.methodrail
  my-app-methodrail/
    .methodrail/
      HARNESS.yaml
      PROJECT.md
      knowledge/
      control/
```

Run the bundled [linked-harness.mjs](../scripts/linked-harness.mjs) transaction, resolving that path relative to this skill:

```text
node scripts/linked-harness.mjs create --repo <git-root>
node scripts/linked-harness.mjs create --repo <git-root> --storage <external-folder>
```

The script:

- requires `--repo` to be the Git root;
- refuses an already tracked or non-linked `.methodrail` path;
- refuses storage inside the repository, including a storage `.methodrail` link whose resolved target is inside the repository;
- creates sibling `.methodrail/` storage and `HARNESS.yaml`;
- binds that manifest to the repository with a relative path;
- parses `HARNESS.yaml` through [harness-manifest.mjs](../scripts/harness-manifest.mjs), the same `repository.path` rules knowledge validation uses;
- adds `/.methodrail` only to Git's local `info/exclude`;
- verifies Git ignores the link before creating it;
- creates the repository-root link only after that check;
- rolls back artifacts from a failed attempt;
- is idempotent when the binding already matches.

After it succeeds, write PROJECT.md, knowledge, and control files through `<git-root>/.methodrail/`. Do not bypass the link by writing arbitrary sibling paths.

Linked external placement supports the Methodrail index, typed and legacy knowledge, freshness, Reflect promotion, and control procedures. `relevant_paths` remain relative to the Git root. The manifest owns repository binding; do not copy the target path into every note.

External storage is still local plaintext, not a secrets vault. Apply the same no-credentials rule used for an in-repository harness.

Do not create host-native skills or host rules in the sibling folder and claim they will be discovered automatically. Record verification under `.methodrail/control/`. The globally installed Methodrail integration is responsible for opening the canonical repository-root path.

Done when binding validation passes, `git status --short` does not show `.methodrail`, knowledge validation uses the target repository, and a second transaction changes neither the manifest nor local exclude file.

## Refresh and failure handling

If `.methodrail` is a directory, refresh in-repository. If it is a link, validate `HARNESS.yaml` and refresh through the link. Do not move between placements unless the user asks.

Fail closed and report the exact condition when:

- the link target is missing;
- HARNESS.yaml is absent, malformed, or bound to another repository;
- `.methodrail` is tracked;
- a non-linked `.methodrail` already exists;
- the external storage path resolves inside the repository;
- Git does not ignore the link.

Do not repair, replace, relink, or adopt an existing nonempty external folder without explicit approval.
