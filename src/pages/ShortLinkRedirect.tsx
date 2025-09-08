import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const ShortLinkRedirect = () => {
  const navigate = useNavigate();
  const params = useParams();

  useEffect(() => {
    const token = params.token || '';
    const hash = window.location.hash || '';
    navigate({ pathname: '/', search: token ? `?x=${encodeURIComponent(token)}` : '', hash }, { replace: true });
  }, [navigate, params.token]);

  return null;
};

export default ShortLinkRedirect;

