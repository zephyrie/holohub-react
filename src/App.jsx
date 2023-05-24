import React, { useEffect, useReducer, useState } from "react";
import { Transition, Dialog } from '@headlessui/react';
import { XMarkIcon } from "@heroicons/react/24/outline";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'

import { reducer, initialState, actionTypes } from "./reducers";
import Card from "./Card";
import Hero from "./Hero";

const App = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [searchTerm, setSearchTerm] = useState("");
  const [enabledTags, setEnabledTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [selectedData, setSelectedData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    dispatch({ type: actionTypes.FETCH_DATA_START });

    try {
      const response = await fetch("aggregate_metadata.json");
      if (!response.ok) {
        throw new Error("Failed to fetch data");
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


  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith("#model_")) {
        const cardId = hash.substring(7);
        const selectedCard = state.data.find((card) => card.application_name === cardId);
        if (selectedCard) {
          openModal(selectedCard);
        }
      } else {
        closeModal();
      }
    };
  
    const handleInitialHashChange = () => {
      setTimeout(() => {
        handleHashChange();
      }, 100);
    };
  
    handleInitialHashChange(); // Call the function when the component mounts to handle initial hash
  
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [state.data]);
  

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

    const filteredTags = Array.from(tagsCountMap.entries()).filter(
      ([, count]) => count >= 3
    );
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

      if (searchTerm === "" && enabledTags.length === 0) {
        // No search term and no enabled tags, return all data
        return true;
      } else if (searchTerm === "" && enabledTags.length > 0) {
        // No search term but has enabled tags, match any enabled tag
        return enabledTags.some((tag) => tags.includes(tag));
      } else if (searchTerm !== "" && enabledTags.length === 0) {
        // Has search term but no enabled tags, match the search term
        return matchesSearchTerm;
      } else {
        // Has search term and enabled tags, match both search term and any enabled tag
        return (
          matchesSearchTerm && enabledTags.some((tag) => tags.includes(tag))
        );
      }
    });
    dispatch({ type: actionTypes.SET_FILTERED_DATA, payload: filteredData });
  };

  const isTagEnabled = (tag) => enabledTags.includes(tag);
  const filteredData = state.filteredData || [];

  const openModal = (data) => {
    setSelectedData(data);
    setIsModalOpen(true);
    const cardId = `model_${data.application_name}`;
    window.location.hash = cardId;
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedData(null);
    history.pushState("", document.title, window.location.pathname); 
  };
  
  return (
    <>
      <Hero />
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4">Holohub Applications</h1>

        <div className="relative my-2">
          <label
            htmlFor="name"
            className="absolute -top-2 left-2 inline-block bg-white px-1 text-xs font-medium text-gray-900"
          >
            Search
          </label>
          <input
            type="text"
            placeholder="Tool Segmentation..."
            value={searchTerm}
            onChange={handleSearch}
            className="block w-full rounded-md border-0 p-1.5 pl-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-lime-600 sm:text-sm sm:leading-6"
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 text-xs">
          <span>Popular Tags:</span>
          {allTags.map((tag) => (
            <span
              key={tag}
              className={`relative z-10 rounded-md my-1 px-2 py-1 text-xs font-medium cursor-pointer ${
                isTagEnabled(tag)
                  ? "bg-lime-500 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </span>
          ))}
        </div>

        {state.loading ? (
          <p className="my-4">Loading...</p>
        ) : state.error ? (
          <p className="my-4">Error: {state.error}</p>
        ) : filteredData.length > 0 ? (
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 border-t border-gray-200 mb-8 pt-2 sm:mt-4 sm:pt-4 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {filteredData.map((jsonData, index) => (
              <Card key={index} data={jsonData} openModal={openModal} />
            ))}
          </div>
        ) : (
          <p className="my-4">No results found.</p>
        )}
      </div>
      {/* Modal */}
      <Transition.Root show={isModalOpen} as={React.Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={closeModal}
          open={isModalOpen}
        >
          <div className="flex items-center justify-center min-h-screen">
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-75" />

            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className="bg-white rounded-lg shadow-lg border-2 border-gray-300 max-h-[calc(80vh)] max-w-[calc(80vw)]"
                static
              >
               {selectedData && (
                  <>
                    <Dialog.Title className="text-lg font-bold p-4 border-b-2">
                      {selectedData.application.name}
                      <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                        <button
                          type="button"
                          className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-grey-500 focus:ring-offset-2"
                          onClick={() => closeModal(true)}
                        >
                          <span className="sr-only">Close</span>
                          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>
                    </Dialog.Title>
                    <div className="max-h-[calc(60vh)] overflow-y-auto p-4">
                      <Dialog.Description className="mb-4">
                        <ReactMarkdown
                          className="markdown pre my-2 text-sm leading-6 text-gray-600 break-words"
                          remarkPlugins={[remarkGfm]}>
                            {selectedData.readme}
                        </ReactMarkdown>
                      </Dialog.Description>
                    </div>
                    <div className="flex justify-end p-4 border-t-2">
                      <a className="mx-2" href={`https://github.com/nvidia-holoscan/holohub/tree/main/applications/${selectedData.application_name}`} target="_blank">
                        <button
                          className="bg-lime-500 text-white px-4 py-2 rounded hover:bg-lime-600 focus:outline-none focus:ring-2 focus:ring-lime-500"
                        >
                          Go to App on GitHub
                        </button>
                      </a>
                      <button
                        onClick={closeModal}
                        className="bg-lime-500 text-white px-4 py-2 rounded hover:bg-lime-600 focus:outline-none focus:ring-2 focus:ring-lime-500"
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
      {/* Footer */}
      <footer aria-labelledby="footer-heading">
        <h2 id="footer-heading" class="sr-only">Footer</h2>
        <div class="mx-auto max-w-7xl px-6 pb-8 lg:px-8">
          <div class="mt-16 border-t border-gray-900/10 lg:mt-24">
            <p class="mt-8 text-gray-500 text-center">NVIDIA HoloHub</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default App;
