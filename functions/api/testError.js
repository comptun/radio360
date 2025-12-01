export function onRequest(context) {
  setTimeout(() => {
    throw new Error();
  });
}