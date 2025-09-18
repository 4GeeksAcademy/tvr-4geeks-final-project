export const Footer = () => (
	<footer className="footer py-3 px-3" style={{ backgroundColor: "#eeeeeeff" }}>
		<div className="container-fluid">
			<div className="row align-items-center">
				<div className="col-6 text-start small text-muted">
					&copy; {new Date().getFullYear()} All rights reserved.
				</div>
				<div className="col-6 text-end">
					<a href="/" className="text-decoration-none me-3">Home</a>
					<a href="/locations" className="text-decoration-none me-3">Locations</a>
					<a href="/about" className="text-decoration-none">About Us</a>
				</div>
			</div>
		</div>
	</footer>
);
