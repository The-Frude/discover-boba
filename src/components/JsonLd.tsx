// Renders a JSON-LD <script> tag. `<` is escaped so structured data can't
// prematurely close the script tag or inject markup.
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
