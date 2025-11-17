import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="page not-found">
    <p className="eyebrow">404</p>
    <h2>We could not find that view.</h2>
    <p className="muted-copy">
      The link may be outdated or private. Return to the studio overview to continue designing your conversation.
    </p>
    <Link to="/" className="btn primary">
      Back to safety
    </Link>
  </div>
);

export default NotFoundPage;
