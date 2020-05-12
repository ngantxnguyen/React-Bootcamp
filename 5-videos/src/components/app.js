import React from 'react';
import SearchBar from './SearchBar';
import youtube from '../apis/youtube';

const KEY = 'YOUTUBE_API_KEY';

class App extends React.Component {
  state = { videos: [] };
  onTermSubmit = async term => {
    const response = await youtube.get('/search', {
      params: {
        part: 'snippet',
        type: 'videos',
        maxResults: 5,
        key: KEY,
        q: term,
      },
    });

    this.setState({ videos: response.data.items });
  };

  render() {
    return (
      <div className="ui container">
        <SearchBar onFormSubmit={this.onTermSubmit} />
        <p>I have {this.state.videos.length} videos.</p>
      </div>
    );
  }
}

export default App;
