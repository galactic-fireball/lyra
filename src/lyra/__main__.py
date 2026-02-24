from lyra.app import init_app


def main():
	app = init_app()
	app.run(port=5001, debug=True, use_reloader=True)


if __name__ == '__main__':
	main()
