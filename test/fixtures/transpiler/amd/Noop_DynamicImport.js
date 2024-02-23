export default () => {
  import('./foo')
    .then(() => { console.log('success') })
    .catch(() => { console.log('error') })
}
