// import '@babel/polyfill';

const a = 10;

const p = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('成功');
  }, 1000);
});

p.then((msg) => {
  console.log(msg);

});

console.log(p, a);
