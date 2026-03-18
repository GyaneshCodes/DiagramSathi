const regex = /test/g;

["test1", "test2", "test3"].forEach(line => {
  let match;
  while ((match = regex.exec(line)) !== null) {
    console.log("matched in", line);
  }
});
