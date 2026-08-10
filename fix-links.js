const fs = require('fs');
const glob = require('glob'); // Not available? I'll use standard fs methods

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Make sure buttonVariants is imported if we are about to use it
  if (content.includes('<Link') && content.includes('<Button') && !content.includes('buttonVariants')) {
    content = content.replace(/import { Button } from "@/components\/ui\/button";/, 'import { Button, buttonVariants } from "@/components/ui/button";');
  }

  // Very simplistic regex for <Link href="..."><Button [props]>...</Button></Link>
  // This might be tricky because of multiline. I will use a custom replacer.
  // Actually, I can just write a Node script to match and replace.

}
