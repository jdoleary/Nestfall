import { readdir, readFile, writeFile } from 'fs/promises';
import Handlebars from 'handlebars';
import marked from 'marked';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const PATH_TEMPLATES = '../templates';
const PATH_ARTICLES = '../articles';
const PATH_OUTPUT = './out';

try {

    // Copy assets/ to out/

    // get page template
    const pageTemplateFileContents = await readFile(`${PATH_TEMPLATES}/page.handlebars`, { encoding: 'utf-8' })
    const pageTemplate = Handlebars.compile(pageTemplateFileContents)

    const allArticleFiles = await readdir(PATH_ARTICLES)
    const articleMetaFiles = allArticleFiles.filter(s => s.endsWith('.json'))
    for (let metaFilePath of articleMetaFiles) {
        const fileNameWithoutExtension = metaFilePath.split('.')[0];
        const newFileName = `${fileNameWithoutExtension}.html`
        const writePath = `${PATH_OUTPUT}/${newFileName}`
        readFile(`${PATH_ARTICLES}/${metaFilePath}`, { encoding: 'utf-8' })
            .then(fileContents => JSON.parse(fileContents)).then(async metaFileJson => {
                const markdownPath = `${PATH_ARTICLES}/${metaFilePath.split('.json').join('.md')}`;
                const articleMarkdown = await readFile(markdownPath, { encoding: 'utf-8' })
                // Convert the article markdown to HTML
                const markdownConvertedToHTML = marked(articleMarkdown);
                // Sanitize the html
                const sanitizedHTML = purify(markdownConvertedToHTML);
                // Apply the article content and meta infromation to the template
                const generatedHTML = pageTemplate({ ...metaFileJson, articleContents: sanitizedHTML, ...{ url: newFileName } })
                await writeFile(writePath, generatedHTML, { encoding: 'utf-8' })
            }).catch(e => {
                console.error(`Error for article: ${fileNameWithoutExtension}\n`, e)
            })
    }
} catch (e) {
    console.error(e)
}

function purify(uncleanHTMLString) {
    const window = new JSDOM('').window;
    const DOMPurify = createDOMPurify(window);

    return DOMPurify.sanitize(uncleanHTMLString);

}