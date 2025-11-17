import { Link } from 'react-router-dom';

const stats = [
  {
    label: 'Always ready',
    description: 'The chat system stays online so your team can jump into a session anytime.',
  },
  {
    label: 'Built for people',
    description: 'Simple layouts make it easy for anyone to test ideas and share feedback.',
  },
  {
    label: 'Tracks every step',
    description: 'Full history keeps every prompt, reply, and note available for review.',
  },
];

const features = [
  {
    title: 'Live session sync',
    description: 'Messages stream over a WebSocket so every browser in the session stays in step.',
    icon: '🔄',
  },
  {
    title: 'Stored history',
    description: 'Redis keeps each conversation for a full day, letting you close the tab and resume later.',
    icon: '🗂️',
  },
  {
    title: 'Global lobby',
    description: 'Join the shared "global-lobby" room to chat with anyone else testing the system.',
    icon: '🌍',
  },
  {
    title: 'Open API',
    description: 'FastAPI endpoints let you list, post, delete, and stream chat messages for any session.',
    icon: '🛠️',
  },
];

const LandingPage = () => {
  return (
    <div className="page landing-page">
      <section className="hero">
        <p className="eyebrow pill">Reliable chat system</p>
        <h1>This is a chat system made for teamwork.</h1>
        <p>This chat system gives your team one clear place to plan, test, and share assistant ideas.</p>
        <p>Invite anyone, try prompts side by side, and see what feels right for real people.</p>
        <div className="hero-actions">
          <Link to="/chat" className="btn primary">
            Start chatting
          </Link>
          <Link to="/global-chat" className="btn secondary">
            Visit global room
          </Link>
          <a href="#feature-grid" className="btn ghost">
            Explore features
          </a>
        </div>
        <div className="stat-board">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <p className="stat-label">{stat.label}</p>
              <p>{stat.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="feature-grid" className="feature-grid">
        {features.map((feature) => (
          <article key={feature.title} className="feature-card">
            <span className="feature-icon" aria-hidden="true">
              {feature.icon}
            </span>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
};

export default LandingPage;
