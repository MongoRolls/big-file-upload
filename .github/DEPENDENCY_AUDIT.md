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

## Compatible dependency updates

Nest stays on 10.x; Swagger stays on 8.x. Existing compatible dependency ranges
are refreshed. Nest 10.4.22 already uses Multer 2, but pins 2.0.2; the narrowly
scoped overrides select patched versions in the same major lines:

| Parent | Dependency | Patched version |
| --- | --- | --- |
| @nestjs/platform-express | multer / body-parser / express | 2.5.0 / 1.20.9 / 4.22.3 |
| @nestjs/swagger | lodash / js-yaml | 4.18.1 / 4.3.2 |
| @nestjs/cli | glob / webpack | 10.5.0 / 5.112.0 |
| @angular-devkit/core | picomatch / ajv | 4.0.4 / 8.18.0 |

Multer is also a direct dependency for a route-scoped error filter. Nest 10's
message-based translation misses Multer 2.5's changed `Unexpected file field`
message; the filter translates the typed Multer error by its stable code. Tests
verify malformed/oversized/unexpected uploads remain 4xx, a valid upload retains
bytes/fields, the server survives malformed multipart, and resume storage works.

Local audit after the update: 672 dependencies, 2 low / 3 moderate / 1 high /
0 critical; still exit 1. Remaining: external-editor -> tmp (high + low),
file-type and Nest core (moderate; fixes require newer major lines), deepmerge
(low; audit reports no fixed version). No broad overrides across those API
boundaries, no findings suppressed. CI tests/build and audit are separate jobs;
passing compatibility tests does not override a failing audit.
