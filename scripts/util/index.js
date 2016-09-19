export function finish(error) {
  /* eslint-disable xo/no-process-exit */
  if (error) {
    console.log('Script error', error)
    console.log(error.stack)
    process.exit(1)
  } else {
    console.log('Script complete')
    process.exit(0)
  }
}
