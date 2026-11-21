# iqra-ma3na
مكتبة إقرأ معنا - مكتبة رقمية لملفات PDF

https://unknoun-boy.github.io/iqra-ma3na/

## Setup

This is a simple static website. Open `index.html` in a browser or deploy the
project to any static host.

## Add a book

Open `admin.html` on the deployed website. The admin page uses a GitHub
personal access token for uploads and deletions. Create a fine-grained token
for this repository with **Contents: Read and write**, then enter it on the
admin page.

The token is kept only for the current tab. It is removed when you log out or
close the tab.

The public library reads PDFs from these folders:

```text
books/general/
books/educational/
books/literary/
```

The website finds PDFs automatically; the filename is used as the book title.

The site uses GitHub's public API, so it is best for a small library. Only
publish books that you are allowed to distribute.