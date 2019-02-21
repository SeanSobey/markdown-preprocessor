# markdown-preprocessor

A preprocessor for markdown designed to make document sites for Github Pages. It extends [gitdown](https://github.com/gajus/gitdown).

## Installation

```
npm i markdown-preprocessor
```

## Usage

See the [gitdown usage](https://github.com/gajus/gitdown) for the gitdown features.

```
markdown-preprocessor --src ./src --dest ./docs --generate-index --generate-header --generate-footer
```

## Features

### Embed a video

```
{"gitdown": "video:youtube", "url": "https://www.youtube.com/watch?v=Dvi8P-lhJmE", "collapse": true}
{"gitdown": "video:youtube", "key": "Dvi8P-lhJmE"}
```

Generates:

---

<div align="center">
	<iframe width="560" height="315" src="https://www.youtube.com/embed/Dvi8P-lhJmE" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

---

### Embed site

#### As a card

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

📁 [ExampleFolder](ExampleFolder/index.md)


📄 [ExampleFile.md](ExampleFile.md)

---

### Header

This is enabled by the cli command `--generate-header`.

Generates a header including the file name

### Footer

This is enabled by the cli command `--generate-footer`.

Generates a footer including navigation buttons.
