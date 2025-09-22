import logoNav from "../assets/img/logo-nav.png";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';

export const Footer = () => (
	<footer className="footer py-5" style={{ position: 'relative', backgroundColor: "#edf6f9", boxShadow: '0 -3px 6px rgba(2,48,49,0.1)', minHeight: "120px" }}>
		<div className="container" >
			<div className="row align-items-center">
				<div className="col-12 col-md-4 d-flex align-items-center mb-3 mb-md-0">
					<img src={logoNav} alt="Logo" style={{ width: 90, marginRight: 12 }} />
					<div>
						<div className="fw-bold" style={{ color: '#006d77' }}>Travel App</div>
						<div className="small text-muted">&copy; {new Date().getFullYear()} All rights reserved.</div>
					</div>
				</div>

				<div className="col-12 col-md-8 d-flex justify-content-md-end">
					<nav className="d-flex gap-3 align-items-center">
						<a href="/" className="text-decoration-none" style={{ color: '#006d77', opacity: 0.9 }}>Home</a>
						<a href="/locations" className="text-decoration-none" style={{ color: '#006d77', opacity: 0.9 }}>Locations</a>
						<a href="/about" className="text-decoration-none" style={{ color: '#006d77', opacity: 0.9 }}>About Us</a>

						<div className="d-flex gap-2 align-items-center" style={{ marginLeft: 8 }}>
							<a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" style={{ color: '#006d77', opacity: 0.9 }}>
								<FontAwesomeIcon icon={faInstagram} />
							</a>
							<a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter" style={{ color: '#006d77', opacity: 0.9 }}>
								<FontAwesomeIcon icon={faTwitter} />
							</a>


							<button
								onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
								aria-label="Back to top"
								className="btn btn-sm"
								style={{ background: 'transparent', border: '1px solid rgba(0,109,119,0.08)', color: '#006d77', padding: '4px 8px', borderRadius: 6 }}
							>
								<FontAwesomeIcon icon={faArrowUp} />
							</button>
						</div>
					</nav>
				</div>
			</div>
		</div>
		<style>{`
				.footer { transition: box-shadow 0.2s ease; }
				/* decorative thin line to emphasize separation */
						.footer::before {
							content: '';
							position: absolute;
							top: 0;
							left: 0;
							right: 0;
							height: 1px;
							background: rgba(0,109,119,0.08);
						}
				.footer a { transition: transform 0.15s, opacity 0.15s; color: #006d77; }
				/* keep link color consistent on hover, only a slight lift */
				.footer a:hover { transform: translateY(-2px); opacity: 1 !important; }
				@media (max-width: 767px) {
					.footer { text-align: center; }
					.footer::before { left: 4%; right: 4%; }
				}
			`}</style>
	</footer>
);
