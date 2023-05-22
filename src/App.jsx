import React, { useEffect, useReducer, useState } from 'react';

import { reducer, initialState, actionTypes } from './reducers';
import Card from './card';
import Hero from './hero';

const App = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [searchTerm, setSearchTerm] = useState('');
  const [enabledTags, setEnabledTags] = useState([]);
  const [allTags, setAllTags] = useState([]);

  const fetchData = async () => {
    dispatch({ type: actionTypes.FETCH_DATA_START });

    try {
      const response = await fetch('aggregate_metadata.json');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      dispatch({ type: actionTypes.FETCH_DATA_SUCCESS, payload: data });
      extractAllTags(data);
    } catch (error) {
      dispatch({ type: actionTypes.FETCH_DATA_ERROR, payload: error.message });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [searchTerm, enabledTags, state.data]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleTagClick = (tag) => {
    if (enabledTags.includes(tag)) {
      setEnabledTags(enabledTags.filter((t) => t !== tag));
    } else {
      setEnabledTags([...enabledTags, tag]);
    }
  };

  const extractAllTags = (data) => {
    const tagsCountMap = new Map();
    data.forEach((item) => {
      const { application } = item;
      const { tags } = application;
      tags.forEach((tag) => {
        if (tagsCountMap.has(tag)) {
          tagsCountMap.set(tag, tagsCountMap.get(tag) + 1);
        } else {
          tagsCountMap.set(tag, 1);
        }
      });
    });
  
    const filteredTags = Array.from(tagsCountMap.entries()).filter(([, count]) => count >= 3);
    const extractedTags = filteredTags.map(([tag]) => tag).sort();
    setAllTags(extractedTags);
  };

  const applyFilter = () => {
    const filteredData = state.data.filter((item) => {
      const { readme, application } = item;
      const { tags } = application;
  
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const matchesSearchTerm =
        readme.toLowerCase().includes(lowerCaseSearchTerm) ||
        tags.some((tag) => tag.toLowerCase().includes(lowerCaseSearchTerm));
  
      if (searchTerm === '' && enabledTags.length === 0) {
        // No search term and no enabled tags, return all data
        return true;
      } else if (searchTerm === '' && enabledTags.length > 0) {
        // No search term but has enabled tags, match any enabled tag
        return enabledTags.some((tag) => tags.includes(tag));
      } else if (searchTerm !== '' && enabledTags.length === 0) {
        // Has search term but no enabled tags, match the search term
        return matchesSearchTerm;
      } else {
        // Has search term and enabled tags, match both search term and any enabled tag
        return matchesSearchTerm && enabledTags.some((tag) => tags.includes(tag));
      }
    });
    dispatch({ type: actionTypes.SET_FILTERED_DATA, payload: filteredData });
  };

  const isTagEnabled = (tag) => enabledTags.includes(tag);
  const filteredData = state.filteredData || [];

  return (
    <>
      <Hero/>
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4">Holohub Applications</h1>

        <div className="relative my-2">
          <label htmlFor="name" className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900">Application</label>
          <input
            type="text"
            placeholder="Segmentation..."
            value={searchTerm}
            onChange={handleSearch}
            className="block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 text-xs">
          {allTags.map((tag) => (
            <span
              key={tag}
              className={`relative z-10 rounded-md bg-blue-50 my-1 px-2 py-1 text-xs font-medium cursor-pointer ${
                isTagEnabled(tag) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
              }`}
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </span>
          ))}
        </div>

        {state.loading ? (
          <p>Loading...</p>
        ) : state.error ? (
          <p>Error: {state.error}</p>
        ) : filteredData.length > 0 ? (
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 border-t border-gray-200 pt-2 sm:mt-4 sm:pt-4 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {filteredData.map((jsonData, index) => <Card key={index} data={jsonData} />)}
          </div>
        ) : (
          <p>No results found.</p>
        )}
      </div>
    </>
  );
};

export default App;
