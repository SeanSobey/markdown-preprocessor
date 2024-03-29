# markdown-preprocessor

A preprocessor for markdown designed to make document sites for Github Pages. It extends [gitdown](https://github.com/gajus/gitdown).

## Installation

```
npm i markdown-preprocessor
```

## Usage

See the [gitdown usage](https://github.com/gajus/gitdown) for the gitdown features.

```
markdown-preprocessor --src ./src --dest ./docs --home-url https://example.com --generate-index --generate-header --generate-footer --remove-link-fileext
```

## Features

### Images

#### Options

* `url`: The url for the image.
* `link` (optional): Clickable link for the image.
* `alt` (optional): Alt text for the image.
* `center` (optional): Center the image. Default is true.

```
{"gitdown": "image", "url": "https://search.chow.com/thumbnail/640/0/www.chowstatic.com/assets/2014/12/10836_creamy_tomato_soup_original_3000_2.jpg"}
```

Generates:

---

<img src="https://search.chow.com/thumbnail/640/0/www.chowstatic.com/assets/2014/12/10836_creamy_tomato_soup_original_3000_2.jpg" alt="" style="display: block;margin-left: auto;margin-right: auto; width: 50%">

---

### Embed a video

#### Options

* Need one of `key` or `url`:
* `key` (optional): The video key for the youtube video.
* `url` (optional): The url for the youtube video.
* `timestamps` (optional): An array of strings (eg "0m10s:a note") with timestamps for the video, generates a table with links to the time codes.
* `collapse` (optional): Wrap the video in a collapsible bar.

```
With a key
{"gitdown": "video:youtube", "key": "Dvi8P-lhJmE"}
With a full url and hidden under a collapse
{"gitdown": "video:youtube", "url": "https://www.youtube.com/watch?v=Dvi8P-lhJmE", "collapse": true, "collapseSummary": "Every Matthew McConaughey "Alright" In Chronological Order (1993 - 2017)"}
// With timestamps
// Note see nested object parsing limitation,
// And Solution: https://stackoverflow.com/questions/26910402/regex-to-match-json-in-a-document/26910403
{"gitdown": "video:youtube", "key": "Dvi8P-lhJmE", "timestamps": [
	"0m10s:a note",
	"0m20s:another note",
	"0m30s:yet another note"
]}
```

Generates:

---

<div align="center">
	<iframe width="560" height="315" src="https://www.youtube.com/embed/Dvi8P-lhJmE" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

---

### Embed site

#### As a card

##### Options

* `url`: The url for the site.

```
{"gitdown": "site:card", "url": "https://www.foundmyfitness.com/"}
```

Generates:

---

<details>
<summary>https://www.foundmyfitness.com/</summary>
<blockquote cite="https://www.foundmyfitness.com/" style="padding-top:2px;padding-bottom:2px;">
	<section>
		<img src="https://www.foundmyfitness.com/favicon.ico" width="16" height="16">
		<i>www.foundmyfitness.com</i>
	</section>
	<section>
		<a href="https://www.foundmyfitness.com/">
			<b>FoundMyFitness</b>
		</a>
	</section>
	<section>
		Promoting strategies to increase healthspan, well-being, cognitive and physical performance through deeper understandings of nutrition, genetics, and cell biology.
	</section>
	<section>
		<img src="https://www.foundmyfitness.com/images/fmf-og-image.jpg">
	</section>
</blockquote>
</details>

---

#### As an iframe

##### Options

* `url`: The url for the site.

```
{"gitdown": "site:embed", "url": "https://www.foundmyfitness.com/"}
```

Generates:

---

<details>
	<summary>https://www.foundmyfitness.com/</summary>
	<blockquote cite="https://www.foundmyfitness.com/" style="padding-top:2px;padding-bottom:2px;">
		<div align="center">
			<iframe width="852" height="315" src="https://www.foundmyfitness.com/" frameborder="0"></iframe>
		</div>
	</blockquote>
</details>

---

### Generate index pages

This is enabled by the cli command `--generate-index`.
Your folder structure will be recursively walked and `index.md` pages will be created for all folders populated with links to files and folders within.

Generates:

---

# Folder Name

📁 [ExampleFolder](ExampleFolder/index)


📄 [ExampleFile](ExampleFile)

---

### Header

This is enabled by the cli command `--generate-header`.

Generates a header including the file name

### Footer

This is enabled by the cli command `--generate-footer`.

Generates a footer including navigation buttons.

### Remove file extensions

This allows better linking in GitHub pages but will break any locally hosted links. Enabled via `--remove-link-fileext`

### Debugging

You can enable verbose logging with the `--verbose` flag.
