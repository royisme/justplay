import ReactMarkdown from "react-markdown";

interface MarkdownProps {
  children: string;
  className?: string;
}

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        components={{
        strong: ({ children }) => <span className="font-bold text-primary">{children}</span>,
        em: ({ children }) => <span className="italic text-accent">{children}</span>,
        h1: ({ children }) => <h1 className="text-2xl font-serif font-bold mt-6 mb-4">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-serif font-bold mt-5 mb-3">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-serif font-bold mt-4 mb-2">{children}</h3>,
        p: ({ children }) => <p className="mb-4 leading-relaxed text-lg">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-accent/30 pl-4 italic my-4 text-text-secondary">
            {children}
          </blockquote>
        ),
      }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
