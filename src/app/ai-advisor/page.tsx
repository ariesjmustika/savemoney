import AIAdvisor from '@/components/AIAdvisor';

export default function AIAdvisorPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>AI Financial Advisor</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Get personalized insights powered by Google Gemini.</p>
      </div>

      <AIAdvisor />

      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Coming Soon: Budget Planning</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>
          The AI will soon be able to help you plan your monthly budget automatically based on your historical spending.
        </p>
      </div>
    </div>
  );
}
