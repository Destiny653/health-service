# TODO: Fix Axios Network Error for Sign-In

## Tasks
- [x] Update request interceptor in `lib/axios.ts` to exclude `/auth/` paths from adding the `Authorization` header.
- [x] Add retry logic to `signInMutation` in `app/(auth)/sign-in/_component/signIn.tsx` for `ERR_NETWORK` errors.
- [x] Add retry logic to `personalityMutation` in `app/(auth)/sign-in/_component/signIn.tsx` for `ERR_NETWORK` errors.
