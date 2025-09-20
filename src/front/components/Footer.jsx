export const Footer = () => (
	<footer className="footer py-3 px-3" style={{ backgroundColor: "#83C5BE" }}>
		<div className="container-fluid">
			<div className="row align-items-center">
				<div className="col-6 text-start small text-muted">
					&copy; {new Date().getFullYear()} All rights reserved.
				</div>
				<div className="col-6 d-flex flex-column flex-sm-row justify-content-end align-items-end align-items-sm-center gap-2 gap-sm-0 text-end">
					<a href="/" className="text-decoration-none me-0 me-sm-3">Home</a>
					<a href="/locations" className="text-decoration-none me-0 me-sm-3">Locations</a>
					<a href="/about" className="text-decoration-none">About Us</a>
				</div>
			</div>
		</div>
	</footer>
);
