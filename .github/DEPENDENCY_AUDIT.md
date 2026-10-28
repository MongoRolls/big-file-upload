# Dependency audit checkout scope

The audit covers `nest-server` with pnpm 10.28.2 and its version 9 lockfile,
including development dependencies. Findings at low severity or above fail CI.
No project install or lifecycle scripts run.

`react-client` is an existing gitlink at
`872616ba78572c34993f79164166c1877515133a`, not tracked source files in this
repository. Its original upstream URL is unknown. `.gitmodules` records only
its existing path and disables updates; no URL is guessed and no gitlink or user
code is removed. `git submodule update --init` remains unsupported until the
owner supplies a verified upstream URL. React dependency audit coverage is not
claimed.

`actions/checkout` invokes `git submodule foreach --recursive` for authentication
cleanup even with `submodules: false`. Without the path/name mapping this fails
before audit. Path mapping lets Git enumerate the uninitialized gitlink without
fetching it and keeps `persist-credentials: false` intact. Sparse checkout alone
does not fix that failure.

Regression verification in a fresh local checkout (do not initialize submodules):

```sh
git ls-tree HEAD react-client
git submodule foreach --recursive true
git submodule status
test -s nest-server/package.json && test -s nest-server/pnpm-lock.yaml
cd nest-server
pnpm audit --json --audit-level=low --registry=https://registry.npmjs.org
```

The first command must still show mode 160000 and the original commit; foreach
must exit zero; status must show the uninitialized gitlink. The audit must run
and preserve a nonzero exit for real vulnerabilities or registry/tool errors.
