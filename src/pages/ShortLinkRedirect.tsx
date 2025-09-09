import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const ShortLinkRedirect = () => {
  const navigate = useNavigate();
  const params = useParams();

  useEffect(() => {
    const token = params.token || '';
    const hash = window.location.hash || '';
    // Redirect to root with x= token in query for deep-linking
    navigate({ pathname: '/', search: token ? `?x=${encodeURIComponent(token)}` : '', hash }, { replace: true });
  }, [navigate, params.token]);

  return null;
};

export default ShortLinkRedirect;
