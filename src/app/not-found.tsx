import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="sec page-h">
      <span className="mono">[404]</span>
      <h1>Nothing at this address.</h1>
      <p className="lede"><Link href="/">Back to the home page</Link></p>
    </section>
  );
}
