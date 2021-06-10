var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!',
  },
  methods: {
    updateSnapshot(path: string) {
      fetch('/api/update-snapshots', { method: 'PATCH' })
        .then((r) => console.log('response', r))
        .catch((e) => {
          console.log('error', e);
        });
    },
  },
});
