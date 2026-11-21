import React, { useEffect, useMemo, useState } from "react";

const API_URL = "https://api.tvmaze.com";
const PAGE_SIZE = 24;

function getSummaryText(summary) {
  if (!summary) return "No synopsis is available for this show yet.";
  const document = new DOMParser().parseFromString(summary, "text/html");
  return document.body.textContent.trim();
}

function formatYear(date) {
  const year = Number(date?.slice(0, 4));
  return Number.isInteger(year) && year > 0 ? year : "Year unknown";
}

function ShowCard({ show, onSelect }) {
  return (
    <article className="show-card">
      <button
        className="poster-button"
        type="button"
        onClick={() => onSelect(show)}
        aria-label={`See details for ${show.name}`}
      >
        {show.image?.medium ? (
          <img className="poster" src={show.image.medium} alt={`${show.name} poster`} loading="lazy" />
        ) : (
          <span className="poster-placeholder" aria-hidden="true">
            <span>✦</span>
            <small>{show.name}</small>
          </span>
        )}
        <span className="poster-overlay">View details <span aria-hidden="true">↗</span></span>
      </button>
      <div className="card-content">
        <div className="card-heading">
          <h3 title={show.name}>{show.name}</h3>
          <span className="rating"><span aria-hidden="true">★</span> {show.rating?.average ?? "NR"}</span>
        </div>
        <p className="card-meta">
          <span>{formatYear(show.premiered)}</span>
          <span className="meta-dot" aria-hidden="true">·</span>
          <span>{show.genres?.[0] ?? "Series"}</span>
        </p>
        <button className="details-link" type="button" onClick={() => onSelect(show)}>
          See details <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}

function ShowModal({ show, onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("modal-open");
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="show-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close details">
          ×
        </button>
        <div className="modal-art">
          {show.image?.original ? (
            <img src={show.image.original} alt="" />
          ) : show.image?.medium ? (
            <img src={show.image.medium} alt="" />
          ) : null}
          <div className="modal-art-shade" />
          <span className="modal-eyebrow">THE STORY</span>
        </div>
        <div className="modal-content">
          <p className="eyebrow">{show.type || "TV series"}{show.language ? ` · ${show.language}` : ""}</p>
          <h2 id="modal-title">{show.name}</h2>
          <div className="modal-facts">
            <span className="rating"><span aria-hidden="true">★</span> {show.rating?.average ?? "Not rated"}</span>
            <span>{formatYear(show.premiered)}</span>
            {show.runtime ? <span>{show.runtime} min / episode</span> : null}
            {show.status ? <span>{show.status}</span> : null}
          </div>
          {show.genres?.length > 0 && (
            <div className="genre-list">
              {show.genres.map((genre) => <span className="genre-tag" key={genre}>{genre}</span>)}
            </div>
          )}
          <h3 className="summary-title">Synopsis</h3>
          <p className="summary-text">{getSummaryText(show.summary)}</p>
          {show.network?.name || show.webChannel?.name ? (
            <p className="network-line">Watch on <strong>{show.network?.name ?? show.webChannel?.name}</strong></p>
          ) : null}
          {show.officialSite && (
            <a className="official-link" href={show.officialSite} target="_blank" rel="noreferrer">
              Visit official site <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </section>
    </div>
  );
}

function App() {
  const [page, setPage] = useState("home");
  const [shows, setShows] = useState([]);
  const [selectedShow, setSelectedShow] = useState(null);
  const [query, setQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState("All");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestVersion, setRequestVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const searchTerm = query.trim();
    setLoading(true);
    setError("");
    setShows([]);
    setVisibleCount(PAGE_SIZE);
    const timer = window.setTimeout(async () => {
      try {
        const endpoint = searchTerm
          ? `${API_URL}/search/shows?q=${encodeURIComponent(searchTerm)}`
          : `${API_URL}/shows?page=0`;
        const response = await fetch(endpoint, { signal: controller.signal });
        if (!response.ok) throw new Error(`The show service responded with ${response.status}.`);
        const result = await response.json();
        const items = searchTerm ? result.map((item) => item.show) : result;
        setShows(items);
        setVisibleCount(PAGE_SIZE);
      } catch (requestError) {
        if (requestError.name !== "AbortError") {
          setError("We couldn’t load shows right now. Please check your connection and try again.");
          setShows([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, searchTerm ? 350 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, requestVersion]);

  const genres = useMemo(() => {
    const allGenres = new Set(shows.flatMap((show) => show.genres ?? []));
    return ["All", ...Array.from(allGenres).sort()];
  }, [shows]);

  const filteredShows = useMemo(
    () => activeGenre === "All" ? shows : shows.filter((show) => show.genres?.includes(activeGenre)),
    [activeGenre, shows],
  );
  const visibleShows = filteredShows.slice(0, visibleCount);

  function openListing() {
    setPage("shows");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openHome() {
    setPage("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const featuredShows = shows.slice(0, 4);

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); openHome(); }}>
          <span className="brand-icon" aria-hidden="true">r.</span>
          <span>reelgood<span className="brand-period">.</span></span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={page === "home" ? "nav-link active" : "nav-link"} onClick={openHome}>Home</button>
          <button className={page === "shows" ? "nav-link active" : "nav-link"} onClick={openListing}>Explore</button>
        </nav>
        <button className="header-cta" onClick={openListing}>Browse shows <span aria-hidden="true">↗</span></button>
      </header>

      <main>
        {page === "home" ? (
          <>
            <section className="hero">
              <div className="hero-texture" aria-hidden="true" />
              <div className="hero-content">
                <p className="eyebrow hero-eyebrow"><span className="live-dot" /> YOUR NEXT FAVORITE IS OUT THERE</p>
                <h1>Stories worth<br />staying in for<span className="hero-period">.</span></h1>
                <p className="hero-description">
                  A world of brilliant shows, hidden gems, and unforgettable stories — all in one place.
                </p>
                <button className="primary-button" onClick={openListing}>
                  Find your next watch <span aria-hidden="true">↗</span>
                </button>
                <div className="hero-note"><span className="note-line" /> A little less scrolling. A lot more watching.</div>
              </div>
              <div className="hero-art" aria-hidden="true">
                <div className="hero-orbit orbit-one" />
                <div className="hero-orbit orbit-two" />
                <div className="hero-sun" />
                <div className="hero-poster poster-back">
                  {shows[2]?.image?.original && <img src={shows[2].image.original} alt="" />}
                </div>
                <div className="hero-poster poster-front">
                  {shows[0]?.image?.original && <img src={shows[0].image.original} alt="" />}
                  <div className="poster-caption"><span>THE GOOD STUFF</span><strong>One great story<br />changes everything.</strong></div>
                </div>
                <span className="art-spark spark-one">✳</span>
                <span className="art-spark spark-two">✦</span>
                <span className="art-label">CURATED FOR YOUR COUCH</span>
              </div>
              <div className="hero-bottom">
                <span>01 — ENDLESS STORIES</span>
                <span className="scroll-cue">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></span>
                <span>MADE FOR THE LOVE OF TV</span>
              </div>
            </section>

            <section className="featured-section section-wrap">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">A GOOD PLACE TO START</p>
                  <h2>Stories to get you started<span className="hero-period">.</span></h2>
                </div>
                <button className="text-button" onClick={openListing}>See all shows <span aria-hidden="true">→</span></button>
              </div>
              {loading && featuredShows.length === 0 ? (
                <div className="loading-state"><span className="spinner" /> Finding good stories...</div>
              ) : error ? (
                <p className="inline-error">{error}</p>
              ) : featuredShows.length > 0 ? (
                <div className="show-grid featured-grid">
                  {featuredShows.map((show) => <ShowCard key={show.id} show={show} onSelect={setSelectedShow} />)}
                </div>
              ) : null}
            </section>
            <section className="manifesto">
              <span className="manifesto-mark" aria-hidden="true">“</span>
              <p>Because finding a great show<br />should feel like the best part.</p>
              <span className="eyebrow">YOUR NEXT WATCH STARTS HERE</span>
            </section>
          </>
        ) : (
          <section className="listing-page">
            <div className="listing-intro">
              <p className="eyebrow"><span className="live-dot" /> THE SHOW FINDER</p>
              <h1>Find your next<br />favorite<span className="hero-period">.</span></h1>
              <p>Good stories are closer than you think. What are you in the mood for?</p>
            </div>
            <div className="search-wrap">
              <span className="search-icon" aria-hidden="true">⌕</span>
              <input
                type="search"
                value={query}
                onChange={(event) => { setQuery(event.target.value); setActiveGenre("All"); }}
                placeholder="Search a show, a feeling, a favorite..."
                aria-label="Search shows by title"
              />
              {query && <button className="clear-search" onClick={() => setQuery("")} aria-label="Clear search">×</button>}
              <span className="search-hint">PRESS ENTER</span>
            </div>
            <div className="listing-toolbar">
              <div className="genre-filters" aria-label="Filter by genre">
                {genres.map((genre) => (
                  <button
                    className={activeGenre === genre ? "genre-filter selected" : "genre-filter"}
                    key={genre}
                    onClick={() => { setActiveGenre(genre); setVisibleCount(PAGE_SIZE); }}
                  >
                    {genre}
                  </button>
                ))}
              </div>
              <span className="results-count">
                {loading ? "Finding shows..." : `${filteredShows.length} ${filteredShows.length === 1 ? "show" : "shows"}`}
              </span>
            </div>
            {error ? (
              <div className="empty-state"><span className="empty-icon">!</span><h2>We hit a little pause.</h2><p>{error}</p><button className="primary-button" onClick={() => setRequestVersion((version) => version + 1)}>Try again <span aria-hidden="true">↗</span></button></div>
            ) : loading && shows.length === 0 ? (
              <div className="loading-state listing-loading"><span className="spinner" /> Finding good stories...</div>
            ) : visibleShows.length > 0 ? (
              <>
                <div className="show-grid listing-grid">
                  {visibleShows.map((show) => <ShowCard key={show.id} show={show} onSelect={setSelectedShow} />)}
                </div>
                {visibleCount < filteredShows.length && (
                  <div className="load-more-wrap">
                    <button className="secondary-button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                      Load more shows <span aria-hidden="true">↓</span>
                    </button>
                  </div>
                )}
              </>
            ) : !loading ? (
              <div className="empty-state">
                <span className="empty-icon">⌕</span>
                <h2>No shows found.</h2>
                <p>Try a different title or choose another genre. Your next favorite is still out there.</p>
                {activeGenre !== "All" && <button className="text-button" onClick={() => setActiveGenre("All")}>Clear genre filter <span aria-hidden="true">→</span></button>}
              </div>
            ) : null}
          </section>
        )}
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#home" onClick={(event) => { event.preventDefault(); openHome(); }}>
          <span className="brand-icon" aria-hidden="true">r.</span>
          <span>reelgood<span className="brand-period">.</span></span>
        </a>
        <p>For the love of a really good story.</p>
        <span className="copyright">© 2026 Reelgood. Made for the curious.</span>
      </footer>

      {selectedShow && <ShowModal show={selectedShow} onClose={() => setSelectedShow(null)} />}
    </>
  );
}

export default App;
