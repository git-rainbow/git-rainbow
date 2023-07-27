import requests


def github_gql(query, variables, headers):
    """ used to request graphql.
    Args:
        query (str): Stored query string in graphql format
        variables (dict): Stored data using graphql query
        headers (dict): Stored data to be in html header on request
    Returns:
        dict: data containing the result of a request
    """
    req = requests.post('https://api.github.com/graphql', json={'query': query, 'variables': variables},
                        headers=headers)
    res = req.json()
    return res
