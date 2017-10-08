import * as chai from 'chai';
import * as mocha from 'mocha';
import { existsSync, unlinkSync } from 'fs';
import { sync as delSync } from 'del';
import { EOL } from 'os';

const expect = chai.expect;
const should = chai.should;
const assert = chai.assert;

import { VStor } from './';
const vstor = new VStor();

describe('VStor', () => {

  it('should read file and return "Hello Vstor."', () => {
    const val = vstor.read('src/test/hello.txt').toValue();
    assert.equal(val, 'Hello VStor.');
  });

  it('should read file and return default value.', () => {
    const val = vstor.read('src/test/bad.txt', 'default value.').toValue();
    assert.equal(val, 'default value.');
  });

  it('should check if has key "hello.txt".', () => {
    const val = vstor.hasKey('src/test/hello.txt');
    assert.isNotNull(val);
  });

  it('should append file and return "Hello Vstor Appended."', (done) => {
    vstor
      .append('src/test/hello.txt', 'Appended')
      .save(() => {
        let val: any = vstor.read('src/test/hello.txt').toValue();
        val = val.split(EOL)[1];
        assert.equal(val, 'Appended');
        done();
      });
  });

  it('should write to "hello.txt" using original value.', (done) => {
    vstor
      .write('src/test/hello.txt', 'Hello VStor.')
      .save(() => {
        const val = vstor.read('src/test/hello.txt').toValue();
        assert.equal(val, 'Hello VStor.');
        done();
      });
  });

  it('should copy "hello.txt" to "copied.txt".', (done) => {
    vstor
      .copy('src/test/hello.txt', 'src/test/copied.txt')
      .save(() => {
        assert.equal(existsSync('./src/test/copied.txt'), true);
        done();
      });
  });

  it('should move "copied.txt" to "moved.txt".', (done) => {
    vstor
      .move('src/test/copied.txt', 'src/test/moved.txt')
      .save(() => {
        assert.equal(existsSync('./src/test/moved.txt'), true);
        done();
      });
  });

  it('should remove "moved.txt".', (done) => {
    vstor
      .remove('src/test/moved.txt')
      .save(() => {
        assert.equal(existsSync('./src/test/moved.txt'), false);
        done();
      });
  });

  it('should copy directory fromdir into todir.', (done) => {
    vstor
      .copy('src/test/fromdir', 'src/test/todir')
      .save(() => {
        assert.equal(existsSync('src/test/todir'), true);
        done();
      });
  });

  it('should write file using JSON.', (done) => {
    vstor
      .write('src/test/data.json', { name: 'Rand', age: 36 })
      .save(() => {
        const obj = vstor.read('src/test/data.json').toValue();
        assert.deepEqual(obj, { name: 'Rand', age: 36 });
        done();
      });
  });

  after((done) => { // cleanup.
    delSync([ // remove copy to test dir.
      './src/test/todir'
    ]);
    done();
  });

});