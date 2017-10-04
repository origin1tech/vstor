# VStor

In memory file manager using Vinyl files such as used in Gulp. Allows working with files in memory before writing to dist. Supports filters like you'd use with a Gulp plugin. Similar to [mem-fs-editor](https://github.com/SBoudrias/mem-fs-editor) with a few more API methods also handles in memory copy a little better preventing need of saving before moving or removing.

## Install

--production is optional, but prevents installing devDependencies.

```sh
$ npm install vstor --production
```

## Usage

Using TypeScript or ES6

```ts
import { VStor } from 'vstor';
const vstor = new VStor({ /* your options */ });
const contents = vstor.read('./some/path/to/file.txt').toValue();
```

Using ES5

```js
var VStor = require('vstor').VStor;
var vstor = new VStor({ /* your options */ });
var buf = vstor.read('./some/path/to/file.txt').toBuffer();
```

## Options

<table>
  <thead>
    <tr><th>Option</th><th>Description</th><th>Default</th></tr>
  </thead>
  <tbody>
    <tr><td>basePath</td><td>a base path all files should be relative to</td><td>process.cwd()</td></tr>
    <tr><td>jsonSpacer</td><td>string or number of spaces for formatting JSON</td><td>2</td></tr>
  </tbody>
</table>

## API

Arguments are depicted with TypeScript type annotations.

#### Properties

<table>
  <thead>
    <tr><th>Property</th><th>Description</th></tr>
  </thead>
  <tbody>
    <tr><td>options</td><td>object containing VStor options.</td></tr>
    <tr><td>store</td><td>returns the entire file store.</td></tr>
  </tbody>
</table>

#### Methods

<table>
  <thead>
    <tr><th>Method</th><th>Description</th><th>Arguments</th><th>Returns</th></tr>
  </thead>
  <tbody>
    <tr><td>resolveKey</td><td>resolves file key using base path.</td><td>key: string</td><td>string</td></tr>
    <tr><td>hasKey</td><td>checks if store contains key.</td><td>key: string</td><td>VinylFile</td></tr>
    <tr><td>exists</td><td>checks if file in store and not deleted.</td><td>path: string | VinylFile</td><td>boolean</td></tr>
    <tr><td>isEmpty</td><td>check if file contents are not null.</td><td>path: string | VinylFile</td><td>boolean</td></tr>
    <tr><td>read</td><td>reads a file.</td><td>path: string | VinylFile, def?: any</td><td>IReadMethods</td></tr>
    <tr><td>write</td><td>writes a file.</td><td>path: string | VinylFile, contents: string | Buffer | IMap<any>, stat?: Stats</td><td>VStor</td></tr>
    <tr><td>copy</td><td>copies a file or directory of files.</td><td>from: string | string[], to: string, options?: IGlobOptions | CopyTransform, transform?: CopyTransform</td><td>VStor</td></tr>
    <tr><td>move</td><td>moves a file.</td><td>from: string, to: string, options?: IGlobOptions</td><td>VStor</td></tr>
    <tr><td>append</td><td>appends value to file.</td><td>to: string, content: string | Buffer, trim?: boolean</td><td>VStor</td></tr>
    <tr><td>remove</td><td>removes a file.</td><td>paths: string | string[], options?: IGlobOptions</td><td>VStor</td></tr>
    <tr><td>save</td><td>saves all changes to disk.</td><td>filters?: Transform[] | SaveCallback, fn?: SaveCallback</td><td>VStor</td></tr>
  </tbody>
</table>

## Examples

#### Writing file to JSON.

```ts
vstor
  .write('./some/path/data.json', { name: 'John', age: 33 })
  .save();
```

#### Move file.

```ts
vstor
  .move('./some/path/data.json', './some/path/moved.json')
  .save();
```

#### Appending to a file.

```ts
vstor
  .append('./some/path/myfile.txt', 'some new line.')
  .save();
```

#### Apply filter on save.

Filter callback args:

+ file - the Vinyl File object.
+ enc - the file encoding.
+ done - callback to continue.

```ts
vstor
  .save((file, enc, done) => {
    // do something on each file in store.
    done();
  });
```

## Events

VStor provides events you can listen on.

<table>
  <thead>
    <tr><th>Event</th><th>Description</th><th>Arguments</th></tr>
  </thead>
  <tbody>
    <tr><td>changed</td><td>fires on any put to store.</td><td>file: VinylFile, vstor: VStor</td></tr>
    <tr><td>copied</td><td>fires on file copied.</td><td>file: VinylFile, vstor: VStor</td></tr>
    <tr><td>moved</td><td>fires on file moved.</td><td>file: VinylFile, vstor: VStor</td></tr>
    <tr><td>appended</td><td>fires on file appended.</td><td>file: VinylFile, vstor: VStor</td></tr>
    <tr><td>removed</td><td>fires on file removed.</td><td>file: VinylFile, vstor: VStor</td></tr>
  </tbody>
</table>

#### Liten to any change event.

Below describes listening to the "changed" event but all events work exactly the same.

```ts
vstor.on('changed', (file) => {
  // do something with the changed file.
});
```


## Change

See [CHANGE.md](CHANGE.md)

## License

See [LICENSE.md](LICENSE.md)
