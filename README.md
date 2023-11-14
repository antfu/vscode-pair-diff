# pair-diff

<a href="https://marketplace.visualstudio.com/items?itemName=antfu.pair-diff" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/v/antfu.pair-diff.svg?color=eee&amp;label=VS%20Code%20Marketplace&logo=visual-studio-code" alt="Visual Studio Marketplace Version" /></a>

Pair files for quick diffing.

## Configrations

### `pair-diff.patterns`

An array for patterns to match files in pairs. For example:

```jsonc
{
  "pair-diff.patterns": [
    {
      "source": "./test/*/input.ts",
      "target": "<dir>/output.ts"
    },
    {
      "source": "./test/input/*.*",
      "target": "<dir>/../output/<basename>"
    }
  ]
}
```

The `source` option supports glob patterns, and the `target` option supports the following placeholders:

- `<dir>` / `<dirname>`: the directory of the source file
- `<base>` / `<basename>`: the filename of the source file, with extension
- `<name>`: the basename of the source file without extension
- `<ext>`: the extension name of the source file

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.png'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2022 [Anthony Fu](https://github.com/antfu)
